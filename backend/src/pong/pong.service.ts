import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PongService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchUserMatchResults(userID: number) {
    const results = await this.prisma.matchUserRelation.findMany({
      where: {
        userID: userID,
      },
      orderBy: {
        matchResult: {
          endAt: 'desc',
        },
      },
      include: {
        matchResult: {
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

    return results.map((result) => result.matchResult);
  }
}
