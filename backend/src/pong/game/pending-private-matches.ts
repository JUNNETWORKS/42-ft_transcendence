import { Server } from 'socket.io';

import { OngoingMatches } from './ongoing-matches';
import { OnlineMatch } from './online-match';
import { PostMatchStrategy } from './PostMatchStrategy';

// 募集中のプライベートマッチの集合
export class PendingPrivateMatches {
  // pendingMatches[主催者UserID] = OnlineMatch;
  private pendingMatches: Map<number, OnlineMatch>;

  static readonly UNDEFINED_USER = -1;

  constructor(
    private wsServer: Server,
    private ongoingMatches: OngoingMatches,
    private postMatchStrategy: PostMatchStrategy
  ) {}

  createPrivateMatch(userId: number) {
    const match = new OnlineMatch(
      this.wsServer,
      userId,
      PendingPrivateMatches.UNDEFINED_USER,
      'PRIVATE',
      (matchID) => this.ongoingMatches.removeMatch(matchID),
      this.postMatchStrategy
    );
  }
}
