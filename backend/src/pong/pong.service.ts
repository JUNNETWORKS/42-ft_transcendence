import { HttpException, Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';

import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { PrismaService } from '../prisma/prisma.service';
import { OnlineMatch } from './game/online-match';

@Injectable()
export class PongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsServer: WsServerGateway
  ) {}

  async fetchUserMatchResults(userID: number) {
    const results = await this.prisma.matchUserRelation.findMany({
      where: {
        userID: userID,
        match: {
          matchStatus: 'DONE',
        },
      },
      orderBy: {
        match: {
          endAt: 'desc',
        },
      },
      include: {
        match: {
          include: {
            config: {
              select: {
                maxScore: true,
                speed: true,
              },
            },
          },
        },
      },
    });

    const idSet = new Set<number>();
    results.forEach((item) => {
      idSet.add(item.match.userID1);
      idSet.add(item.match.userID2);
    });

    const userResults = await this.prisma.user.findMany({
      where: {
        id: { in: [...idSet] },
      },
    });

    const targetUser = userResults.find((item) => item.id === userID);

    const matchWithOpponent = results.map(({ match }) => {
      const opponentUserId =
        match.userID1 === userID ? match.userID2 : match.userID1;
      const opponentUser = userResults.find(
        (item) => item.id === opponentUserId
      );
      return { opponent: opponentUser, match: match };
    });

    return {
      user: targetUser,
      history: matchWithOpponent,
    };
  }

  async fetchUserStats(userID: number) {
    const results = await this.prisma.matchUserRelation.findMany({
      where: {
        userID: userID,
        match: {
          matchStatus: 'DONE',
        },
      },
      orderBy: {
        match: {
          endAt: 'desc',
        },
      },
      include: {
        match: true,
      },
    });

    const matchCount = results.length;
    const winMatchCount = results.filter(
      ({ match: { userID1, userID2, userScore1, userScore2 } }) => {
        if (userScore1 > userScore2 && userID1 === userID) return true;
        if (userScore2 > userScore1 && userID2 === userID) return true;
        return false;
      }
    ).length;
    const loseMatchCount = matchCount - winMatchCount;

    const winRate = matchCount
      ? Math.floor(
          ((winMatchCount / matchCount) * 100 * Math.pow(10, 2)) /
            Math.pow(10, 2)
        )
      : null;

    const userRankPoint = await this.prisma.userRankPoint
      .findUnique({
        where: { id: userID },
      })
      .then((res) => (res ? res.rankPoint : 0));

    //自分のランクポイントを超えるユーザーの数をカウントして順位とする
    const rankPlace = await this.prisma.userRankPoint.count({
      where: { rankPoint: { gt: userRankPoint } },
    });

    return {
      winMatchCount,
      loseMatchCount,
      winRate,
      rankPlace: rankPlace + 1, //1位だと0個なので調整
    };
  }

  async createMatch(match: OnlineMatch) {
    await this.prisma.match.create({
      data: {
        id: match.matchID,
        matchType: match.matchType,
        matchStatus: MatchStatus.PREPARING,
        userID1: match.playerIDs[0],
        userScore1: match.playerScores[0],
        userID2: match.playerIDs[1],
        userScore2: match.playerScores[1],
        startAt: new Date(),

        // TODO: Configを実装したらベタ書きを辞める
        // TODO: Configを非Nullableにする
        config: {
          create: {
            maxScore: 15,
            speed: 10,
          },
        },
        matchUserRelation: {
          create: [
            {
              userID: match.playerIDs[0],
            },
            {
              userID: match.playerIDs[1],
            },
          ],
        },
      },
    });
  }

  async updateMatchAsDone(match: OnlineMatch) {
    await this.prisma.match.update({
      where: {
        id: match.matchID,
      },
      data: {
        matchStatus: MatchStatus.DONE,
        userScore1: match.playerScores[0],
        userScore2: match.playerScores[1],
        endAt: new Date(),
      },
    });
  }

  async updateMatchAsError(match: OnlineMatch) {
    await this.prisma.match.update({
      where: {
        id: match.matchID,
      },
      data: {
        matchStatus: MatchStatus.ERROR,
        endAt: new Date(),
      },
    });
  }

  async updateMatchStatus(matchID: string, status: MatchStatus) {
    await this.prisma.match.update({
      where: {
        id: matchID,
      },
      data: {
        matchStatus: status,
      },
    });
  }

  async fetchUserRanking(count = 10) {
    const results = await this.prisma.userRankPoint.findMany({
      take: count,
      orderBy: [
        {
          rankPoint: 'desc',
        },
        {
          id: 'asc',
        },
      ],
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            isEnabledAvatar: true,
          },
        },
      },
    });
    return results;
  }

  updateRankPoint(winnerID: number, loserID: number) {
    const point = 10;
    this.prisma.$transaction(async (tx) => {
      await tx.userRankPoint.update({
        where: {
          userId: winnerID,
        },
        data: {
          rankPoint: {
            increment: point,
          },
        },
      });
      const currentLoserRankPoint = await tx.userRankPoint.findFirst({
        where: {
          userId: loserID,
        },
      });
      if (
        currentLoserRankPoint &&
        currentLoserRankPoint.rankPoint - point < 0
      ) {
        await tx.userRankPoint.update({
          where: {
            userId: loserID,
          },
          data: {
            rankPoint: 0,
          },
        });
      } else {
        await tx.userRankPoint.update({
          where: {
            userId: loserID,
          },
          data: {
            rankPoint: {
              decrement: point,
            },
          },
        });
      }
    });
  }

  async spectateByMatchID(userId: number, matchId: string) {
    console.log(userId, matchId);
    const match = await this.prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });
    if (!match) throw new HttpException('match is not found', 404);
    if (match.matchStatus !== 'IN_PROGRESS')
      throw new HttpException('match is not in-progress', 400);
    await this.wsServer.usersJoin(userId, { matchId });
    return { status: 'success' };
  }
}
