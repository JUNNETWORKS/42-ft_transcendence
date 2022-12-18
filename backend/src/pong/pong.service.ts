import { HttpException, Injectable } from '@nestjs/common';
import { MatchStatus, MatchType, UserSlotNumber } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { UsersService } from 'src/users/users.service';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { PrismaService } from '../prisma/prisma.service';
import { compact } from '../utils';
import { OnlineMatch } from './game/online-match';

type CreateMatchDTO = {
  matchType: MatchType;
  matchStatus: MatchStatus;
  userId1: number;
  userId2?: number;
};

@Injectable()
export class PongService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsServer: WsServerGateway,
    private readonly usersService: UsersService
  ) {}

  async fetchUserMatchResults(userId: number) {
    const results = await this.prisma.matchUserRelation.findMany({
      where: {
        userId: userId,
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
      idSet.add(item.match.userId1);
      idSet.add(item.match.userId2);
    });

    const userResults = await this.prisma.user.findMany({
      where: {
        id: { in: [...idSet] },
      },
    });

    const targetUser = userResults.find((item) => item.id === userId);

    const matchWithOpponent = results.map(({ match }) => {
      const opponentUserId =
        match.userId1 === userId ? match.userId2 : match.userId1;
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

  async fetchUserStats(userId: number) {
    const results = await this.prisma.matchUserRelation.findMany({
      where: {
        userId: userId,
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
      ({ match: { userId1, userId2, userScore1, userScore2 } }) => {
        if (userScore1 > userScore2 && userId1 === userId) return true;
        if (userScore2 > userScore1 && userId2 === userId) return true;
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
        where: { id: userId },
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

  async createMatch(match: CreateMatchDTO) {
    const result = await this.prisma.match.create({
      data: {
        id: uuidv4(),
        matchType: match.matchType,
        matchStatus: MatchStatus.PREPARING,
        userId1: match.userId1,
        userScore1: 0,
        userId2: match.userId2 ?? 0,
        userScore2: 0,
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
          create: compact([
            match.userId1
              ? {
                  userId: match.userId1,
                  userSlot: UserSlotNumber.SLOT1,
                }
              : undefined,
            match.userId2
              ? {
                  userId: match.userId2,
                  userSlot: UserSlotNumber.SLOT2,
                }
              : undefined,
          ]),
        },
      },
    });
    this.markGaming(
      [result.userId1, result.userId2].filter((id) => !!id),
      result.id
    );

    return result;
  }

  // プライベートマッチの参加者側(userId2)をセットする
  async setApplicantPlayer(matchId: string, userId2: number) {
    await this.prisma.$transaction([
      this.prisma.match.update({
        where: {
          id: matchId,
        },
        data: {
          userId2: userId2,
        },
      }),
      this.prisma.matchUserRelation.create({
        data: {
          matchId: matchId,
          userId: userId2,
          userSlot: UserSlotNumber.SLOT2,
        },
      }),
    ]);
  }

  async updateMatchAsDone(match: OnlineMatch) {
    const result = await this.prisma.match.update({
      where: {
        id: match.matchId,
      },
      data: {
        matchStatus: MatchStatus.DONE,
        userScore1: match.playerScores[0],
        userScore2: match.playerScores[1],
        endAt: new Date(),
      },
    });
    this.unmarkGaming([result.userId1, result.userId2]);
  }

  async updateMatchAsError(match: OnlineMatch) {
    const result = await this.prisma.match.update({
      where: {
        id: match.matchId,
      },
      data: {
        matchStatus: MatchStatus.ERROR,
        endAt: new Date(),
      },
    });
    this.unmarkGaming([result.userId1, result.userId2]);
  }

  async updateMatchStatus(matchId: string, status: MatchStatus) {
    await this.prisma.match.update({
      where: {
        id: matchId,
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

  updateRankPoint(winnerId: number, loserId: number) {
    const point = 10;
    this.prisma.$transaction(async (tx) => {
      await tx.userRankPoint.update({
        where: {
          userId: winnerId,
        },
        data: {
          rankPoint: {
            increment: point,
          },
        },
      });
      const currentLoserRankPoint = await tx.userRankPoint.findFirst({
        where: {
          userId: loserId,
        },
      });
      if (
        currentLoserRankPoint &&
        currentLoserRankPoint.rankPoint - point < 0
      ) {
        await tx.userRankPoint.update({
          where: {
            userId: loserId,
          },
          data: {
            rankPoint: 0,
          },
        });
      } else {
        await tx.userRankPoint.update({
          where: {
            userId: loserId,
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

  async deleteMatchByMatchId(matchId: string) {
    await this.prisma.$transaction([
      this.prisma.matchUserRelation.deleteMany({
        where: {
          matchId: matchId,
        },
      }),
      this.prisma.matchConfig.deleteMany({
        where: {
          matchId: matchId,
        },
      }),
      this.prisma.match.deleteMany({
        where: {
          id: matchId,
        },
      }),
    ]);
  }

  async spectateByMatchId(userId: number, matchId: string) {
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
