import { OnlineMatch } from './online-match';
import { PlayerInput } from './types/game-state';

// 全ての進行中のマッチ管理するクラス
export class OngoingMatches {
  private matches: Map<string, OnlineMatch>;

  constructor() {
    this.matches = new Map<string, OnlineMatch>();
  }

  appendMatch(match: OnlineMatch) {
    this.matches.set(match.matchID, match);
    return match.matchID;
  }

  removeMatch(matchID: string): void {
    this.matches.delete(matchID);
  }

  moveBar(playerID: number, playerAction: PlayerInput) {
    const match = this.findMatchByPlayer(playerID);
    if (match) {
      match.moveBar(playerID, playerAction);
    }
  }

  // プレイヤーが退出
  leave(playerID: number) {
    for (const matchID in this.matches) {
      const match = this.matches.get(matchID);
      if (match?.playerIDs.includes(playerID)) {
        match.leave(playerID);
      }
    }
  }

  findMatchByPlayer(playerID: number) {
    for (const [matchID, match] of this.matches) {
      if (match.playerIDs.includes(playerID)) {
        return match;
      }
    }
  }
}
