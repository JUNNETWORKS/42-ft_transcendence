import { MatchStatus, MatchType } from '@prisma/client';
import { Server } from 'socket.io';

import {
  generateFullRoomName,
  sendResultRoom,
  usersJoin,
  usersLeave,
} from 'src/utils/socket/SocketRoom';

import { PongService } from '../pong.service';
import { OngoingMatches } from './ongoing-matches';
import { OnlineMatch } from './online-match';
import { PostMatchStrategy } from './PostMatchStrategy';

// マッチメイキングの待機キュー
export class WaitingQueue {
  public readonly matchType: MatchType;
  // 待機キュー本体
  private users: Set<number>;
  // WSサーバー
  private wsServer: Server;
  // マッチを作成したらここに追加する
  private ongoingMatches: OngoingMatches;

  constructor(
    matchType: MatchType,
    ongoingMatches: OngoingMatches,
    wsServer: Server,
    private pongService: PongService,
    private postMatchStrategy: PostMatchStrategy
  ) {
    this.matchType = matchType;
    this.users = new Set<number>();
    this.wsServer = wsServer;
    this.ongoingMatches = ongoingMatches;
  }

  // ユーザーを待機キューに追加する
  append(userId: number) {
    this.users.add(userId);
    usersJoin(
      this.wsServer,
      userId,
      generateFullRoomName({ matchMakingId: this.matchType })
    );
    this.createMatches();
  }

  // ユーザーを待機キューから削除する
  remove(userId: number) {
    if (this.users.has(userId)) {
      this.users.delete(userId);
      usersLeave(
        this.wsServer,
        userId,
        generateFullRoomName({ matchMakingId: this.matchType })
      );
    }
  }

  // ユーザーが待機キューに含まれているか
  isUserExists(userId: number): boolean {
    return this.users.has(userId);
  }

  // Match作成を試みる
  private async createMatches() {
    if (this.users.size < 2) {
      return;
    }
    let userPair = new Array<number>();
    const promises = new Array<Promise<void>>();
    const users = [...this.users];
    this.users.clear();
    for (const user of users) {
      userPair.push(user);
      if (userPair.length === 2) {
        promises.push(this.createMatch(userPair[0], userPair[1]));
        userPair = [];
      }
    }
    if (userPair.length) {
      for (const userId of userPair) {
        this.users.add(userId);
      }
    }
    await Promise.all(promises);
  }

  private async createMatch(userId1: number, userId2: number) {
    const match = OnlineMatch.create(
      this.wsServer,
      userId1,
      userId2,
      this.matchType,
      (matchId: string) => this.ongoingMatches.removeMatch(matchId),
      this.postMatchStrategy
    );
    this.ongoingMatches.appendMatch(match);
    await this.pongService.createMatch({
      id: match.matchId,
      matchType: match.matchType,
      matchStatus: MatchStatus.PREPARING,
      userId1: match.playerId1,
      userId2: match.playerId2,
      userScore1: match.playerScore1,
      userScore2: match.playerScore2,
    });
    const matchId = match.matchId;
    usersLeave(
      this.wsServer,
      userId1,
      generateFullRoomName({ matchMakingId: this.matchType })
    );
    usersLeave(
      this.wsServer,
      userId2,
      generateFullRoomName({ matchMakingId: this.matchType })
    );
    sendResultRoom(
      this.wsServer,
      'pong.match_making.done',
      generateFullRoomName({ userId: userId1 }),
      {
        matchId: matchId,
      }
    );
    sendResultRoom(
      this.wsServer,
      'pong.match_making.done',
      generateFullRoomName({ userId: userId2 }),
      {
        matchId: matchId,
      }
    );
    match.start();
    await this.pongService.updateMatchStatus(matchId, MatchStatus.IN_PROGRESS);
  }
}
