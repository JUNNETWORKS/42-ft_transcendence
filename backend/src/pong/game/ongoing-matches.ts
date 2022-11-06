import { Server } from 'socket.io';
import { OnlineMatch } from './online-match';
import { PlayerInput } from './types/game-state';

// 全ての進行中のマッチ管理するクラス
export class OngoingMatches {
  private readonly wsServer: Server;
  private matches: Map<string, OnlineMatch>;

  constructor(wsServer: Server) {
    this.wsServer = wsServer;
  }

  createMatch(userID1: number, userID2: number) {
    const match = new OnlineMatch(this.wsServer, userID1, userID2);
    // TODO: プレイヤーにマッチが開始されたことを通知する
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
      if (match?.getPlayerIDs().includes(playerID)) {
        match.leave(playerID);
      }
    }
  }

  findMatchByPlayer(playerID: number) {
    for (const matchID in this.matches) {
      const match = this.matches.get(matchID);
      if (match?.getPlayerIDs().includes(playerID)) {
        return match;
      }
    }
  }
}
