import { MatchType } from '@prisma/client';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import {
  generateFullRoomName,
  sendResultRoom,
  usersJoin,
  usersLeave,
} from 'src/utils/socket/SocketRoom';

import { Match } from './match';
import { PostMatchStrategy } from './PostMatchStrategy';
import { MatchResult, PlayerInput } from './types/game-state';

type FactoryProps = {
  wsServer: Server;
  userId1: number;
  userId2: number;
  matchType: MatchType;
  removeFn: (matchId: string) => void;
  postMatchStrategy: PostMatchStrategy;
  matchId?: string;
};

// このクラスは以下に対して責任を持つ
// - マッチの保持
// - マッチのWSルームを作成
// - setInterval() で作成されるTimerIdの保持
export class OnlineMatch {
  // マッチId
  private readonly Id: string;
  private readonly roomName: string;
  private readonly match: Match;
  private readonly wsServer: Server;
  private gameStateSyncTimer: NodeJS.Timer;

  public readonly matchType: MatchType;

  private constructor(
    wsServer: Server,
    matchId: string,
    userId1: number,
    userId2: number,
    matchType: MatchType,
    private readonly removeFromOngoingMatches: (matchId: string) => void,
    private readonly postMatchStrategy: PostMatchStrategy
  ) {
    this.wsServer = wsServer;
    this.postMatchStrategy = postMatchStrategy;
    this.Id = matchId;
    this.roomName = generateFullRoomName({ matchId: this.Id });
    this.matchType = matchType;
    this.match = new Match(userId1, userId2);
    this.joinAsSpectator(userId1);
    this.joinAsSpectator(userId2);
  }

  static generateId() {
    return uuidv4();
  }

  static create({
    wsServer,
    userId1,
    userId2,
    matchType,
    removeFn,
    postMatchStrategy,
    matchId = uuidv4(),
  }: FactoryProps) {
    return new OnlineMatch(
      wsServer,
      matchId,
      userId1,
      userId2,
      matchType,
      removeFn,
      postMatchStrategy
    );
  }

  start() {
    this.gameStateSyncTimer = setInterval(async () => {
      this.match.update();

      if (this.wsServer) {
        sendResultRoom(
          this.wsServer,
          'pong.match.state',
          this.roomName,
          this.match.getState()
        );

        if (this.match.winner !== 'none') {
          const loserSide = this.match.winner === 'right' ? 'left' : 'right';
          const result: MatchResult = {
            winner: this.match.players[Match.sideIndex[this.match.winner]],
            loser: this.match.players[Match.sideIndex[loserSide]],
          };
          await sendResultRoom(
            this.wsServer,
            'pong.match.finish',
            this.roomName,
            {
              game: this.match.getState(),
              result,
            }
          );
          this.close();
          this.removeFromOngoingMatches(this.Id);
          this.wsServer.in(this.roomName).socketsLeave(this.roomName);
          this.postMatchStrategy.getOnDone(this.matchType)(this);
        }
      }
    }, 16.66); // 60fps
  }

  // マッチのWSルームに観戦者として参加｡
  // プレイヤーもゲーム状態を受け取るためにこの関数を呼ぶ｡
  joinAsSpectator(userId: number) {
    usersJoin(this.wsServer, userId, this.roomName);
  }

  // ユーザーが退出した際の処理
  leave(userId: number) {
    if (userId in this.match.players) {
      // TODO: ユーザーがプレイヤーだった場合ゲームを終了させる
    }
    usersLeave(this.wsServer, userId, this.roomName);
  }

  // バーを動かす｡プレイヤーとして認識されていない場合は何もしない｡
  moveBar(playerId: number, playerAction: PlayerInput) {
    this.match.moveBar(playerId, playerAction);
  }

  // ゲームを終了
  close() {
    clearInterval(this.gameStateSyncTimer);
  }

  // ゲームの状態更新し､Roomに送信
  syncGameState() {
    if (this.match === undefined) {
      // インスタンスが作られる前に gameStateSyncTimer が呼ばれることがあるのでガードを入れておく｡
      return;
    }

    this.match.update();

    if (this.wsServer) {
      sendResultRoom(
        this.wsServer,
        'pong.match.state',
        this.roomName,
        this.match.getState()
      );

      if (this.match.winner !== 'none') {
        const loserSide = this.match.winner === 'right' ? 'left' : 'right';
        const result: MatchResult = {
          winner: this.match.players[Match.sideIndex[this.match.winner]],
          loser: this.match.players[Match.sideIndex[loserSide]],
        };
        sendResultRoom(
          this.wsServer,
          'pong.match.finish',
          this.roomName,
          result
        );
        this.close();
      }
    }
  }

  get matchId() {
    return this.Id;
  }

  get playerIds() {
    return [this.match.players[0].id, this.match.players[1].id];
  }

  get playerId1() {
    return this.match.players[0].id;
  }

  set playerId1(userId: number) {
    this.match.players[0].id = userId;
  }

  get playerId2() {
    return this.match.players[1].id;
  }

  set playerId2(userId: number) {
    this.match.players[1].id = userId;
  }

  get playerScores() {
    return [this.match.players[0].score, this.match.players[1].score];
  }

  get playerScore1() {
    return this.match.players[0].score;
  }

  get playerScore2() {
    return this.match.players[1].score;
  }

  get winnerId() {
    if (this.match.winner === 'none') {
      return undefined;
    }
    return this.match.players[Match.sideIndex[this.match.winner]].id;
  }

  get loserId() {
    if (this.match.winner === 'none') {
      return undefined;
    }
    const loserSide = this.match.winner === 'right' ? 'left' : 'right';
    return this.match.players[Match.sideIndex[loserSide]].id;
  }
}
