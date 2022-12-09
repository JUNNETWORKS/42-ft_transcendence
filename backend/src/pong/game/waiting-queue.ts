import { MatchType } from '@prisma/client';
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
  append(userID: number) {
    this.users.add(userID);
    usersJoin(
      this.wsServer,
      userID,
      generateFullRoomName({ matchMakingId: this.matchType })
    );
    this.createMatches();
  }

  // ユーザーを待機キューから削除する
  remove(userID: number) {
    if (this.users.has(userID)) {
      this.users.delete(userID);
      usersLeave(
        this.wsServer,
        userID,
        generateFullRoomName({ matchMakingId: this.matchType })
      );
    }
  }

  // ユーザーが待機キューに含まれているか
  isUserExists(userID: number): boolean {
    return this.users.has(userID);
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
      for (const userID of userPair) {
        this.users.add(userID);
      }
    }
    await Promise.all(promises);
  }

  private async createMatch(userID1: number, userID2: number) {
    const match = new OnlineMatch(
      this.wsServer,
      userID1,
      userID2,
      this.matchType,
      (matchID: string) => this.ongoingMatches.removeMatch(matchID),
      this.postMatchStrategy
    );
    this.ongoingMatches.appendMatch(match);
    await this.pongService.createMatch(match);
    const matchID = match.matchID;
    usersLeave(
      this.wsServer,
      userID1,
      generateFullRoomName({ matchMakingId: this.matchType })
    );
    usersLeave(
      this.wsServer,
      userID2,
      generateFullRoomName({ matchMakingId: this.matchType })
    );
    sendResultRoom(
      this.wsServer,
      'pong.match_making.done',
      generateFullRoomName({ userId: userID1 }),
      {
        matchID: matchID,
      }
    );
    sendResultRoom(
      this.wsServer,
      'pong.match_making.done',
      generateFullRoomName({ userId: userID2 }),
      {
        matchID: matchID,
      }
    );
    match.start();
  }
}
