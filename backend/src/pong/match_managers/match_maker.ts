import { ProgressingMatchManager } from './progressing_match_manager';
import { Server } from 'socket.io';
import { Match } from '../game/match';

// マッチ成立待ちユーザーのリストを保持し､定期的にマッチの成立を試みる
export class MatchMaker {
  // マッチメイキングを試みる間隔
  private readonly MatchMakingIntervalMs = 1000;
  private readonly matchMakingProgressSyncIntervalMs = 100;

  // マッチ成立可能かチェックするタイマー
  private matchMakingIntervalID: NodeJS.Timer;
  // マッチメイキング待機ユーザーを共有するタイマー
  private matchMakingProgressSyncIntervalID: NodeJS.Timer;
  // マッチメイキング待機中のユーザー
  private waitingUsers: Array<string> = new Array<string>();
  // マッチが成立したらここに入れる
  private progressingMatchManager: ProgressingMatchManager;
  // 現在のマッチ待機状況を送信するためのWSインスタンス
  private wsServer: Server;

  constructor(
    wsServer: Server,
    progressing_match_manager: ProgressingMatchManager
  ) {
    this.wsServer = wsServer;
    this.progressingMatchManager = progressing_match_manager;
    // 一定時間ごとにマッチの成立が可能か調べ､可能であるならマッチ開始
    this.matchMakingIntervalID = setInterval(() => {
      this.makeMatches();
    }, this.MatchMakingIntervalMs);
    // 一定時間ごとにマッチメイキングの進捗をクライアントに共有する
    this.matchMakingProgressSyncIntervalID = setInterval(() => {
      this.syncMatchMakingProgress();
    }, this.matchMakingProgressSyncIntervalMs);
  }

  entry = (sessionID: string) => {
    this.addWaitingUsers(sessionID);
    this.addMatchMakingRoom(sessionID);
  };

  exit = (sessionID: string) => {
    this.deleteWaitingUsers(sessionID);
    this.deleteMatchMakingRoom(sessionID);
  };

  waitingCount = (): number => {
    return this.waitingUsers.length;
  };

  private addWaitingUsers = (sessionID: string) => {
    if (this.waitingUsers.indexOf(sessionID) === -1) {
      this.waitingUsers.push(sessionID);
    }
  };

  private deleteWaitingUsers = (sessionID: string) => {
    const idx = this.waitingUsers.indexOf(sessionID);
    if (idx !== -1) {
      this.waitingUsers.splice(idx, 1);
    }
  };

  private makeMatches = () => {
    for (; this.waitingUsers.length >= 2; ) {
      const sessionID1 = this.waitingUsers.shift();
      if (!sessionID1) {
        return;
      }
      const sessionID2 = this.waitingUsers.shift();
      if (!sessionID2) {
        this.waitingUsers.unshift(sessionID1);
        return;
      }
      // マッチ開始
      const match = new Match(sessionID1, sessionID2);
      this.progressingMatchManager.startMatch(match);
    }
  };

  private addMatchMakingRoom = (sessionID: string) => {
    // TODO: match_making/waiters roomに入れる
    console.log(sessionID);
  };

  private deleteMatchMakingRoom = (sessionID: string) => {
    // TODO: match_making/waiters roomからユーザーを除く
    console.log(sessionID);
  };

  // マッチメイキングの進捗をクライアントに共有する
  private syncMatchMakingProgress = () => {
    console.log('コミットするためにある意味のないログ');
  };
}
