import { MatchStatus, MatchType } from '@prisma/client';

import { UsersService } from 'src/users/users.service';
import { shuffle, splitPairArray } from 'src/utils';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

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
  private wsServer: WsServerGateway;
  // マッチを作成したらここに追加する
  private ongoingMatches: OngoingMatches;

  constructor(
    matchType: MatchType,
    ongoingMatches: OngoingMatches,
    wsServer: WsServerGateway,
    private usersService: UsersService,
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
    this.wsServer.usersJoin(userId, { matchMakingId: this.matchType });
    this.createMatches();
  }

  // ユーザーを待機キューから削除する
  remove(userId: number) {
    if (this.users.has(userId)) {
      this.users.delete(userId);
      this.wsServer.usersLeave(userId, { matchMakingId: this.matchType });
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

    const waitingUserPairs = splitPairArray(shuffle([...this.users]));

    const blockFilter = await Promise.all(
      waitingUserPairs.map((item) =>
        this.usersService.isBlockedEither(item[0], item[1])
      )
    );
    const filteredUserPair = waitingUserPairs.filter(
      (_, i) => blockFilter[i] === false
    );

    //ペアになったユーザーを削除
    filteredUserPair.flat().forEach((item) => this.users.delete(item));

    const promises = filteredUserPair.map((item) => {
      return this.createMatch(item[0], item[1]);
    });
    await Promise.all(promises);
  }

  private async createMatch(userId1: number, userId2: number) {
    const { id: matchId } = await this.pongService.createMatch({
      matchType: this.matchType,
      matchStatus: MatchStatus.PREPARING,
      userId1,
      userId2,
    });
    const match = OnlineMatch.create({
      wsServer: this.wsServer,
      userId1,
      userId2,
      matchType: this.matchType,
      removeFn: (matchId: string) => this.ongoingMatches.removeMatch(matchId),
      postMatchStrategy: this.postMatchStrategy,
      matchId,
    });

    this.ongoingMatches.appendMatch(match);
    // TODO: ここらへんawaitしなくて大丈夫？
    this.wsServer.usersLeave(userId1, { matchMakingId: this.matchType });
    this.wsServer.usersLeave(userId2, { matchMakingId: this.matchType });
    this.wsServer.sendResults(
      'pong.match_making.done',
      { matchId: matchId },
      { userId: userId1 }
    );
    this.wsServer.sendResults(
      'pong.match_making.done',
      { matchId: matchId },
      { userId: userId2 }
    );
    match.start();
    await this.pongService.updateMatchStatus(matchId, MatchStatus.IN_PROGRESS);
    await this.pongService.markGaming(
      [userId1, userId2].filter((id) => !!id),
      match.matchId
    );
  }
}
