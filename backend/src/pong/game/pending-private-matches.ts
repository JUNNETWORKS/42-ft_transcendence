import { MatchStatus } from '@prisma/client';
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
  // pendingMatches[MatchID] = OnlineMatch;
  private pendingMatches: Map<string, OnlineMatch>;

  static readonly UNDEFINED_USER = -1;

  constructor(
    private wsServer: Server,
    private ongoingMatches: OngoingMatches,
    private pongService: PongService,
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
    this.pongService.createMatch(match);
    this.pendingMatches.set(match.matchID, match);
    sendResultRoom(
      this.wsServer,
      'pong.private_match.created',
      generateFullRoomName({ userId: userId }),
      {
        matchID: match.matchID,
      }
    );
  }

  // 募集中のマッチに2人目のプレイヤーとして参加する
  // この関数が呼ばれ､2人のプレイヤーが揃ったらMatchが開始する
  joinPrivateMatch(matchId: string, userId: number) {
    const match = this.getMatchByMatchId(matchId);
    if (match) {
      match.playerID2 = userId;
      this.pongService.updateMatchStatus(
        match.matchID,
        MatchStatus.IN_PROGRESS
      );
      sendResultRoom(
        this.wsServer,
        'pong.match_making.done',
        generateFullRoomName({ userId: match.playerID1 }),
        {
          matchID: matchId,
        }
      );
      sendResultRoom(
        this.wsServer,
        'pong.match_making.done',
        generateFullRoomName({ userId: match.playerID2 }),
        {
          matchID: matchId,
        }
      );
    }
  }

  // 募集者が接続を切ったり､キャンセルボタンを押したりしたときの処理｡
  // この関数は通信の接続が切れた場合を含むエラー処理の一部として呼ばれる｡
  //
  // pendingMatchesからユーザーが募集者となっているMatchを削除する｡
  // DBからも対象のレコード削除｡
  leavePrivateMatch(userId: number) {}

  getMatchByMatchId(matchId: string) {
    return this.pendingMatches.get(matchId);
  }

  removeMatchByMatchId(matchId: string) {
    this.pendingMatches.delete(matchId);
  }

  getMatchByUserId(userId: number) {
    for (const [_, match] of this.pendingMatches) {
      if (match.playerIDs[0] === userId) {
        return match;
      }
    }
    return undefined;
  }

  removeMatchByUserId(userId: number) {
    for (const [_, match] of this.pendingMatches) {
      if (match.playerIDs[0] === userId) {
        this.pendingMatches.delete(match.matchID);
        break;
      }
    }
  }
}
