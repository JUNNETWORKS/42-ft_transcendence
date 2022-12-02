import { OngoingMatches } from './ongoing-matches';
import { WaitingQueue } from './waiting-queue';

// 複数のマッチメイキングの待機キューを保持する｡
// マッチメイキングの待機キューは以下のような種類がある｡
// - Rank全体で1つ
// - Casual全体で1つ
// - Privateの場合は1試合につき1つ
export class WaitingQueues {
  private queues: Map<string, WaitingQueue>;

  constructor() {
    this.queues = new Map<string, WaitingQueue>();
  }

  // 待機キューを取得する
  getQueue(id: string): WaitingQueue | undefined {
    if (this.queues.has(id)) {
      return this.queues.get(id);
    }
  }

  // 待機キューを追加する
  appendQueue(queue: WaitingQueue): void {
    this.queues.set(queue.id, queue);
  }

  // 待機キューを削除する
  removeQueue(id: string): void {
    if (this.queues.has(id)) {
      this.queues.delete(id);
    }
  }

  // プレイヤーが含まれている待機キューを1つ返す
  getQueueByPlayerID(userID: number): WaitingQueue | undefined {
    for (const queue of this.queues.values()) {
      if (queue.isUserExists(userID)) {
        return queue;
      }
    }
  }
}
