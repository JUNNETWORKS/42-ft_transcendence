import { OngoingMatches } from './ongoing-matches';

export type WaitingQueueConfig = {
  maxWaiters?: number;
  onQueueShutdown?: () => void;
};

// マッチメイキングの待機キュー
export class WaitingQueue {
  // Queueを識別するための文字列｡他のQueueと重複してはいけない｡
  public readonly id: string;
  // 待機キューの最大人数
  private readonly maxWaiterCount: number;
  // 待機キューが削除される際に呼ばれる関数
  private onQueueShutdown?: () => void;
  // 待機キュー本体
  private users: Set<number>;
  // マッチを作成したらここに追加する
  private ongoingMatches: OngoingMatches;
  // マッチメイキングを作成するタイマー
  private matchMakingTimer: NodeJS.Timer;
  private readonly matchMakingIntervalMs = 1000;
  private isCreatingMatch: boolean;

  constructor(
    id: string,
    ongoingMatches: OngoingMatches,
    config?: WaitingQueueConfig
  ) {
    this.id = id;
    this.users = new Set<number>();
    this.maxWaiterCount = config?.maxWaiters || Number.MAX_SAFE_INTEGER;
    this.onQueueShutdown = config?.onQueueShutdown;
    this.ongoingMatches = ongoingMatches;
    // append()等実行時にマッチメイキングを実行しようとすると
    // 排他制御を考える必要があるので定期実行という方式にしている
    this.matchMakingTimer = setInterval(
      this.createMatches,
      this.matchMakingIntervalMs
    );
    this.isCreatingMatch = false;
  }

  // ユーザーを待機キューに追加する
  append(userID: number) {
    if (this.users.size == this.maxWaiterCount) {
      this.users.add(userID);
    }
  }

  // ユーザーを待機キューから削除する
  remove(userID: number) {
    if (this.users.has(userID)) {
      this.users.delete(userID);
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

  // Match作成を試みる
  private async createMatches() {
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
    }
    await Promise.all(promises);
    this.isCreatingMatch = false;
  }

  private async createMatch(userID1: number, userID2: number) {
    // TODO: 各ユーザーが現在Pongの画面に滞在しているかPingする
    // TODO: 片方が通信異常ならば､ this.user に通信正常なユーザーを戻し､通信異常なユーザーにはエラーを通知する
    // マッチを作成し､ ongoingMatches に追加する｡
    this.ongoingMatches.createMatch(userID1, userID2);
  }
}
