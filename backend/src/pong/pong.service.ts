import { HttpException, Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';

import { UsersService } from 'src/users/users.service';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { PrismaService } from '../prisma/prisma.service';
import { OnlineMatch } from './game/online-match';

@Injectable()
export class PongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsServer: WsServerGateway,
    private readonly usersService: UsersService
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
        match.userID1 === userID ? match.userID1 : match.userID2;
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

  async createMatch(match: OnlineMatch) {
    const result = await this.prisma.match.create({
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
    this.markGaming([result.userID1, result.userID2], result.id);
  }

  async updateMatchAsDone(match: OnlineMatch) {
    const result = await this.prisma.match.update({
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
    this.unmarkGaming([result.userID1, result.userID2]);
  }

  async updateMatchAsError(match: OnlineMatch) {
    const result = await this.prisma.match.update({
      where: {
        id: match.matchID,
      },
      data: {
        matchStatus: MatchStatus.ERROR,
        endAt: new Date(),
      },
    });
    this.unmarkGaming([result.userID1, result.userID2]);
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

  async markGaming(usersIds: number[], matchId: string) {
    usersIds.map((userId) => {
      return this.usersService
        .update(userId, {
          ongoingMatchId: matchId,
        })
        .then((u) => this.wsServer.pulse(u.user));
    });
  }

  async unmarkGaming(usersIds: number[]) {
    usersIds.map((userId) => {
      return this.usersService
        .update(userId, {
          ongoingMatchId: null,
        })
        .then((u) => this.wsServer.pulse(u.user));
    });
  }
}
