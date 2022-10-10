import { ProgressingMatchManager } from './progressing_match_manager';

// マッチ成立待ちユーザーのリストを保持し､定期的にマッチの成立を試みる
export class MatchMaker {
  private readonly MatchMakingIntervalMs = 500;

  // マッチ成立可能かチェックするタイマー
  private intervalID: NodeJS.Timer;
  // マッチメイキング待機中のユーザー
  private waitingUsers: Array<string> = new Array<string>();
  // マッチが成立したらここに入れる
  private progressing_match_manager: ProgressingMatchManager;

  constructor(progressing_match_manager: ProgressingMatchManager) {
    this.progressing_match_manager = progressing_match_manager;
    // 500msに一度マッチの成立が可能か調べ､可能であるならマッチ開始
    this.intervalID = setInterval(() => {
      this.makeMatches();
    }, this.MatchMakingIntervalMs);
  }

  entry = (sessionID: string) => {
    this.addWaitingUsers(sessionID);
  };

  exit = (sessionID: string) => {
    this.deleteWaitingUsers(sessionID);
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
      // TODO: マッチの開始
      // - マッチインスタンスの作成
    }
  };
}
