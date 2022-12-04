import { MatchType } from '@prisma/client';
import { Server } from 'socket.io';

import { OnlineMatch } from './online-match';
import { PostMatchStrategy } from './PostMatchStrategy';
import { PlayerInput } from './types/game-state';

// 全ての進行中のマッチ管理するクラス
export class OngoingMatches {
  private readonly wsServer: Server;
  private matches: Map<string, OnlineMatch>;

  constructor(wsServer: Server, private postMatchStrategy: PostMatchStrategy) {
    this.wsServer = wsServer;
    this.matches = new Map<string, OnlineMatch>();
  }

  createMatch(userID1: number, userID2: number, matchType: MatchType) {
    const match = new OnlineMatch(
      this.wsServer,
      userID1,
      userID2,
      matchType,
      (matchID: string) => this.removeMatch(matchID),
      this.postMatchStrategy
    );
    // プレイヤーにマッチが開始されたことを通知する
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
