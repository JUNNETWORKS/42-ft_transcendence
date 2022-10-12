import { Server } from 'socket.io';
import { Match } from '../game/match';

type ProgressingMatch = {
  intervalID: NodeJS.Timer;
  match: Match;
};

// 現在進行中のMatchのクライアントへのゲーム状態の送信などを担うクラス
export class ProgressingMatchManager {
  private readonly GameStateSyncIntervalMs = 16.66; // 60fps
  private progressingMatches: Array<ProgressingMatch> =
    new Array<ProgressingMatch>();
  private wsServer: Server;

  constructor(wsServer: Server) {
    this.wsServer = wsServer;
  }

  // マッチを開始する。
  // - setInterval() を設定し、定期的にゲーム状態をクライアントに送信する
  startMatch = (match: Match) => {
    const intervalID = setInterval(() => {
      match.update();
      this.sendGameState(match);
    }, this.GameStateSyncIntervalMs);
    this.progressingMatches.push({ match, intervalID });
  };

  findProgressingMatchBySessionID = (sessionID: string) => {
    return this.progressingMatches.find((match) => {
      match.match.players[0].id === sessionID ||
        match.match.players[1].id === sessionID;
    })?.match;
  };

  private sendGameState = (match: Match) => {
    const gamestate = match.getState();
    this.wsServer.to(match.players[0].id).emit('pong.match.state', gamestate);
    this.wsServer.to(match.players[1].id).emit('pong.match.state', gamestate);
  };

  private findProgressingMatchByIntervalID = (intervalID: NodeJS.Timer) => {
    return this.progressingMatches.find((match) => {
      match.intervalID === intervalID;
    })?.match;
  };
}
