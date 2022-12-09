import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { minBy } from 'src/utils';

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;

const Params = {
  maxUsers: 100,
  timeSpan: 60 * second,
  maxFailure: 10,
  lockDuration: 12 * hour,
};

@Injectable()
export class AuthLocker {
  private failureHistory: {
    [userId: number]: number[];
  };

  constructor(private prisma: PrismaService) {
    this.failureHistory = {};
  }

  async markFailure(userId: number) {
    const userIdsIn: number[] = Object.keys(this.failureHistory) as any;
    const n = userIdsIn.length + (userId in this.failureHistory ? 1 : 0);
    // LRU
    if (n > Params.maxUsers) {
      const oldestId = minBy(userIdsIn, (id) => {
        const fs = this.failureHistory[id]!;
        return fs[fs.length - 1];
      });
      if (oldestId) {
        delete this.failureHistory[oldestId];
      }
    }

    // now を追加した上で, タイムスパンに収まるものだけを残す
    const now = Date.now();
    const fs = this.failureHistory[userId] || [];
    fs.push(now);
    const nfs = fs.filter((t) => now - Params.timeSpan <= t);
    this.failureHistory[userId] = nfs;

    // 最大許容エラー数に達している場合はアカウント時限ロックをかける
    const rest = Params.maxFailure - nfs.length;
    if (rest > 0) {
      return rest;
    }
    console.log(`LOCK YOU!!:`, userId, nfs);
    delete this.failureHistory[userId];
    await this.lockUser(userId);
    return 0;
  }

  // アカウント時限ロックをかける
  private async lockUser(userId: number) {
    const lockUntil = new Date(Date.now() + Params.lockDuration);
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockUntil,
      },
    });
    console.log(`USER ${userId} LOCKED UNTIL: `, lockUntil);
    return result;
  }
}
