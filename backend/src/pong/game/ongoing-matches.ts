import { Injectable } from '@nestjs/common';

import { OnlineMatch } from './online-match';
import { PlayerInput } from './types/game-state';

// 全ての進行中のマッチ管理するクラス
@Injectable()
export class OngoingMatches {
  private matches: Map<string, OnlineMatch>;

  constructor() {
    this.matches = new Map<string, OnlineMatch>();
  }

  appendMatch(match: OnlineMatch) {
    this.matches.set(match.matchId, match);
    return match.matchId;
  }

  removeMatch(matchId: string): void {
    this.matches.delete(matchId);
  }

  moveBar(playerId: number, playerAction: PlayerInput) {
    const match = this.findMatchByPlayer(playerId);
    if (match) {
      match.moveBar(playerId, playerAction);
    }
  }

  // プレイヤーが退出
  leave(playerId: number) {
    for (const matchId in this.matches) {
      const match = this.matches.get(matchId);
      if (match?.playerIds.includes(playerId)) {
        match.leave(playerId);
      }
    }
  }

  findMatchByPlayer(playerId: number) {
    for (const [matchId, match] of this.matches) {
      if (match.playerIds.includes(playerId)) {
        return match;
      }
    }
  }

  findMatchByMatchId(matchId: string) {
    return this.matches.get(matchId);
  }
}
