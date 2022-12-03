import { Injectable } from '@nestjs/common';

import { pick } from 'src/utils';

import { PrismaService } from '../prisma/prisma.service';
import { OnlineMatch } from './game/online-match';

@Injectable()
export class PongService {
  constructor(private prisma: PrismaService) {}

  async createMatchResult(match: OnlineMatch) {
    await this.prisma.matchResult.create({
      data: {
        id: match.matchID,
        matchType: match.matchType,
        userID1: match.playerIDs[0],
        userScore1: match.playerScores[0],
        userID2: match.playerIDs[1],
        userScore2: match.playerScores[1],
        endAt: new Date(),

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
    return results.map((result) => pick(result, 'rankPoint', 'user'));
  }
}
