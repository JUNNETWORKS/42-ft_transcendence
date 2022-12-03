import { Injectable } from '@nestjs/common';

import { pick } from 'src/utils';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PongService {
  constructor(private readonly prisma: PrismaService) {}

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
