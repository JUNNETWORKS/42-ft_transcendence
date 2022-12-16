import { MatchStatus, MatchType } from '@prisma/client';
import { Server } from 'socket.io';

import {
  generateFullRoomName,
  sendResultRoom,
} from 'src/utils/socket/SocketRoom';

import { PongService } from '../pong.service';
import { OngoingMatches } from './ongoing-matches';
import { OnlineMatch } from './online-match';
import { PostMatchStrategy } from './PostMatchStrategy';

// 募集中のプライベートマッチの集合
export class PendingPrivateMatches {
  // pendingMatches[募集者UserId] = MatchId;
  private pendingMatches: Map<number, string>;

  static readonly UNDEFINED_USER = -1;

  constructor(
    private wsServer: Server,
    private ongoingMatches: OngoingMatches,
    private pongService: PongService,
    private postMatchStrategy: PostMatchStrategy
  ) {
    this.pendingMatches = new Map<number, string>();
  }

  createPrivateMatch(userId: number) {
    const matchId = OnlineMatch.generateId();
    this.pongService.createMatch({
      id: matchId,
      matchType: MatchType.PRIVATE,
      matchStatus: MatchStatus.PREPARING,
      userId1: userId,
      userId2: undefined,
      userScore1: 0,
      userScore2: 0,
    });
    this.pendingMatches.set(userId, matchId);
    console.log(`createPrivateMatch: matchId(${matchId})`);
    console.log(
      `this.pendingMatches: ${JSON.stringify(
        Object.fromEntries(this.pendingMatches)
      )}`
    );
    sendResultRoom(
      this.wsServer,
      'pong.private_match.created',
      generateFullRoomName({ userId: userId }),
      {
        matchId: matchId,
      }
    );
  }

  // 募集中のマッチに2人目のプレイヤーとして参加する
  // この関数が呼ばれ､2人のプレイヤーが揃ったらMatchが開始する
  async joinPrivateMatch(matchId: string, userId: number) {
    const matchOwnerId = this.getUserIdByMatchId(matchId);
    console.log(`joinPrivateMatch: MatchId(${matchId}) by User(${userId})`);
    if (!matchOwnerId) {
      console.log(`joinPrivateMatch: match is not found.`);
      console.log(
        `this.pendingMatches: ${JSON.stringify(
          Object.fromEntries(this.pendingMatches)
        )}`
      );
      return;
    }
    this.drawOutMatchByMatchId(matchId);
    await this.pongService.updateMatchPlayers(matchId, {
      userId1: matchOwnerId,
      userId2: userId,
    });
    const match = OnlineMatch.createWithId(
      this.wsServer,
      matchId,
      matchOwnerId,
      userId,
      MatchType.PRIVATE,
      (matchId: string) => this.ongoingMatches.removeMatch(matchId),
      this.postMatchStrategy
    );
    this.ongoingMatches.appendMatch(match);
    sendResultRoom(
      this.wsServer,
      'pong.private_match.done',
      generateFullRoomName({ userId: matchOwnerId }),
      {
        matchId: matchId,
      }
    );
    sendResultRoom(
      this.wsServer,
      'pong.private_match.done',
      generateFullRoomName({ userId: userId }),
      {
        matchId: matchId,
      }
    );
    match.start();
    this.pongService.updateMatchStatus(match.matchId, MatchStatus.IN_PROGRESS);
  }

  // 募集者が接続を切ったり､キャンセルボタンを押したりしたときの処理｡
  // この関数は通信の接続が切れた場合を含むエラー処理の一部として呼ばれる｡
  //
  // pendingMatchesからユーザーが募集者となっているMatchを削除する｡
  // DBからも対象のレコード削除｡
  leavePrivateMatch(userId: number) {
    const matchId = this.pendingMatches.get(userId);
    if (matchId) {
      this.pongService.deleteMatchByMatchId(matchId);
    }
    this.drawOutMatchByUserId(userId);
  }

  getMatchIdByUserId(userId: number) {
    return this.pendingMatches.get(userId);
  }

  drawOutMatchByUserId(userId: number) {
    this.pendingMatches.delete(userId);
  }

  getUserIdByMatchId(matchId: string) {
    for (const [userId, pendingMatchId] of this.pendingMatches) {
      if (pendingMatchId === matchId) {
        return userId;
      }
    }
    return undefined;
  }

  drawOutMatchByMatchId(matchId: string) {
    const userId = this.getUserIdByMatchId(matchId);
    if (userId) {
      this.drawOutMatchByUserId(userId);
    }
  }
}
