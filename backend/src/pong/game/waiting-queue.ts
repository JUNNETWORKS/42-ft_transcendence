import { OngoingMatches } from './ongoing-matches';
import { Server } from 'socket.io';
import {
  generateFullRoomName,
  sendResultRoom,
  usersJoin,
  usersLeave,
} from 'src/utils/socket/SocketRoom';

export type WaitingQueueConfig = {
  createMatchOnce?: boolean;
  timeoutMs?: number;
  onQueueShutdown?: () => void;
};

// マッチメイキングの待機キュー
export class WaitingQueue {
  // Queueを識別するための文字列｡他のQueueと重複してはいけない｡
  // このIDは招待リンクなどに使われる
  public readonly id: string;
  // 待機キュー本体
  private users: Set<number>;
  // WSサーバー
  private wsServer: Server;
  // マッチを作成したらここに追加する
  private ongoingMatches: OngoingMatches;

  // ===== Config =====
  // 1度マッチを作成したらこの待機キューを削除するか
  private readonly createMatchOnce: boolean;
  // 待機キューが削除される際に呼ばれる関数
  private readonly onQueueShutdown?: () => void;

  // ===== Timers =====
  // マッチメイキングの進捗を共有するタイマー
  private matchMakingStatusTimer: NodeJS.Timer;
  private readonly matchMakingStatusIntervalMs = 500;
  // マッチメイキングを作成するタイマー
  private matchMakingTimer: NodeJS.Timer;
  private readonly matchMakingIntervalMs = 2 * 1000;
  private isCreatingMatch: boolean;
  // 待機キューを削除するタイマー
  // timeoutMs が0以上のときのみ
  private queueDeletionTimer: NodeJS.Timer | null;
  private readonly queueDeletionTimeMs?: number;

  constructor(
    id: string,
    ongoingMatches: OngoingMatches,
    wsServer: Server,
    config?: WaitingQueueConfig
  ) {
    this.id = id;
    this.users = new Set<number>();
    this.createMatchOnce = config?.createMatchOnce || false;
    this.queueDeletionTimeMs = config?.timeoutMs;
    this.onQueueShutdown = config?.onQueueShutdown;
    this.wsServer = wsServer;
    this.ongoingMatches = ongoingMatches;

    this.matchMakingStatusTimer = setInterval(
      () => this.shareMatchMakingStatus(),
      this.matchMakingStatusIntervalMs
    );
    this.matchMakingTimer = setInterval(
      () => this.createMatches(),
      this.matchMakingIntervalMs
    );
    this.isCreatingMatch = false;
    if (this.queueDeletionTimeMs) {
      this.queueDeletionTimer = setTimeout(
        () => this.deleteQueueItself(),
        this.queueDeletionTimeMs
      );
    }
  }

  // ユーザーを待機キューに追加する
  append(userID: number) {
    this.users.add(userID);
    usersJoin(
      this.wsServer,
      userID,
      generateFullRoomName({ matchMakingId: this.id })
    );
    if (this.queueDeletionTimer) {
      clearTimeout(this.queueDeletionTimer);
      this.queueDeletionTimer = null;
    }
  }

  // ユーザーを待機キューから削除する
  remove(userID: number) {
    if (this.users.has(userID)) {
      this.users.delete(userID);
      usersLeave(
        this.wsServer,
        userID,
        generateFullRoomName({ matchMakingId: this.id })
      );

      if (this.users.size === 0 && this.queueDeletionTimeMs) {
        this.queueDeletionTimer = setTimeout(
          () => this.deleteQueueItself(),
          this.queueDeletionTimeMs
        );
      }
    }
  }

  // ユーザーが待機キューに含まれているか
  isUserExists(userID: number): boolean {
    return this.users.has(userID);
  }

  // 待機キュー終了処理を呼び出す
  shutdown() {
    if (this.onQueueShutdown) {
      this.onQueueShutdown();
    }
  }

  // MatchMakingの進捗をユーザーに共有する
  private async shareMatchMakingStatus() {
    sendResultRoom(
      this.wsServer,
      'pong.match_making.progress',
      generateFullRoomName({ matchMakingId: this.id }),
      {
        waitingPlayerCount: this.users.size,
      }
    );
  }

  // Match作成を試みる
  private async createMatches() {
    // 前回呼ばれた createMatches() がまだ実行中の場合は実行しない
    if (this.isCreatingMatch) {
      return;
    }

    this.isCreatingMatch = true;
    let userPair = new Array<number>();
    const promises = new Array<Promise<void>>();
    const users = [...this.users];
    for (const user of users) {
      userPair.push(user);
      if (userPair.length === 2) {
        promises.push(this.createMatch(userPair[0], userPair[1]));
        userPair = [];
      }
      if (this.createMatchOnce) {
        break;
      }
    }
    if (userPair.length) {
      for (const userID of userPair) {
        this.users.add(userID);
      }
    }
    await Promise.all(promises);
    this.isCreatingMatch = false;

    if (this.createMatchOnce) {
      this.deleteQueueItself();
    }
  }

  private async createMatch(userID1: number, userID2: number) {
    // TODO: 各ユーザーが現在Pongの画面に滞在しているかPingする
    // TODO: 片方が通信異常ならば､ this.user に通信正常なユーザーを戻し､通信異常なユーザーにはエラーを通知する
    // マッチを作成し､ ongoingMatches に追加する｡
    this.ongoingMatches.createMatch(userID1, userID2);
    this.users.delete(userID1);
    this.users.delete(userID2);
  }

  private removeAllTimers() {
    if (this.matchMakingStatusTimer) {
      clearInterval(this.matchMakingStatusTimer);
    }
    if (this.matchMakingTimer) {
      clearInterval(this.matchMakingTimer);
    }
    if (this.queueDeletionTimer) {
      clearTimeout(this.queueDeletionTimer);
    }
  }

  private deleteQueueItself() {
    this.removeAllTimers();
    if (this.onQueueShutdown) {
      this.onQueueShutdown();
    }
  }
}
