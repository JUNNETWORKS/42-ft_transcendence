import { OngoingMatches } from './ongoing-matches';
import { Server } from 'socket.io';
import {
  generateFullRoomName,
  sendResultRoom,
  usersJoin,
  usersLeave,
} from 'src/utils/socket/SocketRoom';

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

  constructor(id: string, ongoingMatches: OngoingMatches, wsServer: Server) {
    this.id = id;
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
      generateFullRoomName({ matchMakingId: this.id })
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
        generateFullRoomName({ matchMakingId: this.id })
      );
    }
  }

  // ユーザーが待機キューに含まれているか
  isUserExists(userID: number): boolean {
    return this.users.has(userID);
  }

  // Match作成を試みる
  private async createMatches() {
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
    this.ongoingMatches.createMatch(userID1, userID2);
    this.users.delete(userID1);
    this.users.delete(userID2);
  }
}
