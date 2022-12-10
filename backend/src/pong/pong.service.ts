import { Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { use } from 'passport';

import { generateFullRoomName } from 'src/utils/socket/SocketRoom';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { PrismaService } from '../prisma/prisma.service';
import { OnlineMatch } from './game/online-match';

@Injectable()
export class PongService {
  constructor(
    private prisma: PrismaService,
    private wsServer: WsServerGateway
  ) {}

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
    if (!match) return { status: 'match is not found' };
    if (match.matchStatus !== 'IN_PROGRESS')
      return { status: 'match is not in-progress' };
    await this.wsServer.usersJoin(userId, { matchId });
    return { status: 'success' };
  }
}
