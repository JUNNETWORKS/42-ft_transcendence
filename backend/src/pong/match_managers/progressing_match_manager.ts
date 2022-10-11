import { Server, Socket } from 'socket.io';
import { Match } from '../game/match';

type ProgressingMatch = {
  intervalID: NodeJS.Timer;
  match: Match;
};

// 現在進行中のMatchのクライアントへのゲーム状態の送信などを担うクラス
export class ProgressingMatchManager {
  readonly GameStateSyncIntervalMs = 16.66; // 60fps
  private intervalIDs: Array<string> = new Array<string>();
  private wsServer: Server;

  constructor(wsServer: Server) {
    this.wsServer = wsServer;
  }

  // マッチを開始する。
  // - setInterval() を設定し、定期的に
  start = (match: Match) => {
    const intervalID = setInterval(() => {
      
    }, this.GameStateSyncIntervalMs);
  };

  private sendGameState = (match: Match) => {};

  private findProgressingMatchBySessionID = (sessionID: string) => {};
}
