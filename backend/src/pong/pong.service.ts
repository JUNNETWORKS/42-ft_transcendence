import { Injectable } from '@nestjs/common';
import { Match, MatchStatus, MatchType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { compact } from '../utils';
import { OnlineMatch } from './game/online-match';

import { match } from 'assert';

type CreateMatchDTO = {
  id: string;
  matchType: MatchType;
  matchStatus: MatchStatus;
  userId1?: number;
  userId2?: number;
  userScore1: number;
  userScore2: number;
};

@Injectable()
export class PongService {
  constructor(private prisma: PrismaService) {}

  async createMatch(match: CreateMatchDTO) {
    await this.prisma.match.create({
      data: {
        id: match.id,
        matchType: match.matchType,
        matchStatus: MatchStatus.PREPARING,
        userId1: match.userId1 ? match.userId1 : 0,
        userScore1: match.userScore1,
        userId2: match.userId2 ? match.userId2 : 0,
        userScore2: match.userScore1,
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
                }
              : undefined,
            match.userId2
              ? {
                  userId: match.userId2,
                }
              : undefined,
          ]),
        },
      },
    });
  }

  async updateMatchPlayers(
    matchId: string,
    data: {
      userId1?: number;
      userId2?: number;
    }
  ) {
    await this.prisma.$transaction([
      this.prisma.matchUserRelation.deleteMany({
        where: {
          matchId: matchId,
        },
      }),
      this.prisma.match.updateMany({
        where: {
          id: matchId,
        },
        data: {
          userId1: data.userId1 ? data.userId1 : 0,
          userId2: data.userId2 ? data.userId2 : 0,
        },
      }),
      this.prisma.matchUserRelation.createMany({
        data: compact([
          data.userId1
            ? {
                matchId: matchId,
                userId: data.userId1,
              }
            : undefined,
          data.userId2
            ? {
                matchId: matchId,
                userId: data.userId2,
              }
            : undefined,
        ]),
      }),
    ]);
  }

  async updateMatchAsDone(match: OnlineMatch) {
    await this.prisma.match.update({
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
  }

  async updateMatchAsError(match: OnlineMatch) {
    await this.prisma.match.update({
      where: {
        id: match.matchId,
      },
      data: {
        matchStatus: MatchStatus.ERROR,
        endAt: new Date(),
      },
    });
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
}
