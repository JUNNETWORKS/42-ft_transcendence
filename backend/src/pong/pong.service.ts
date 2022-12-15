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
  userID1?: number;
  userID2?: number;
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
        userID1: match.userID1 ? match.userID1 : 0,
        userScore1: match.userScore1,
        userID2: match.userID2 ? match.userID2 : 0,
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
            match.userID1
              ? {
                  userID: match.userID1,
                }
              : undefined,
            match.userID2
              ? {
                  userID: match.userID2,
                }
              : undefined,
          ]),
        },
      },
    });
  }

  async updateMatchPlayers(
    matchID: string,
    data: {
      userID1?: number;
      userID2?: number;
    }
  ) {
    await this.prisma.$transaction([
      this.prisma.matchUserRelation.deleteMany({
        where: {
          matchID: matchID,
        },
      }),
      this.prisma.match.update({
        where: {
          id: matchID,
        },
        data: {
          userID1: data.userID1 ? data.userID1 : 0,
          userID2: data.userID2 ? data.userID2 : 0,
        },
      }),
      this.prisma.matchUserRelation.createMany({
        data: compact([
          data.userID1
            ? {
                matchID: matchID,
                userID: data.userID1,
              }
            : undefined,
          data.userID1
            ? {
                matchID: matchID,
                userID: data.userID1,
              }
            : undefined,
        ]),
      }),
    ]);
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

  async deleteMatchByMatchID(matchID: string) {
    // TODO: transaction を設定してACIDを保つ
    await this.prisma.$transaction([
      this.prisma.matchUserRelation.deleteMany({
        where: {
          matchID: matchID,
        },
      }),
      this.prisma.matchConfig.deleteMany({
        where: {
          matchID: matchID,
        },
      }),
      this.prisma.match.delete({
        where: {
          id: matchID,
        },
      }),
    ]);
  }
}
