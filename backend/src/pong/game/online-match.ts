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

// このクラスは以下に対して責任を持つ
// - マッチの保持
// - マッチのWSルームを作成
// - setInterval() で作成されるTimerIDの保持
export class OnlineMatch {
  // マッチID
  private readonly ID: string;
  private readonly roomName: string;
  private readonly match: Match;
  private readonly wsServer: Server;
  private gameStateSyncTimer: NodeJS.Timer;

  public readonly matchType: MatchType;

  private constructor(
    wsServer: Server,
    matchID: string,
    userID1: number,
    userID2: number,
    matchType: MatchType,
    private readonly removeFromOngoingMatches: (matchID: string) => void,
    private readonly postMatchStrategy: PostMatchStrategy
  ) {
    this.wsServer = wsServer;
    this.postMatchStrategy = postMatchStrategy;
    this.ID = matchID;
    this.roomName = generateFullRoomName({ matchId: this.ID });
    this.matchType = matchType;
    this.match = new Match(userID1, userID2);
    this.joinAsSpectator(userID1);
    this.joinAsSpectator(userID2);
  }

  static generateID() {
    return uuidv4();
  }

  static create(
    wsServer: Server,
    userID1: number,
    userID2: number,
    matchType: MatchType,
    removeFromOngoingMatches: (matchID: string) => void,
    postMatchStrategy: PostMatchStrategy
  ) {
    return new OnlineMatch(
      wsServer,
      uuidv4(),
      userID1,
      userID2,
      matchType,
      removeFromOngoingMatches,
      postMatchStrategy
    );
  }

  static createWithID(
    wsServer: Server,
    matchID: string,
    userID1: number,
    userID2: number,
    matchType: MatchType,
    removeFromOngoingMatches: (matchID: string) => void,
    postMatchStrategy: PostMatchStrategy
  ) {
    return new OnlineMatch(
      wsServer,
      matchID,
      userID1,
      userID2,
      matchType,
      removeFromOngoingMatches,
      postMatchStrategy
    );
  }

  start() {
    this.gameStateSyncTimer = setInterval(() => {
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
          sendResultRoom(this.wsServer, 'pong.match.finish', this.roomName, {
            game: this.match.getState(),
            result,
          });
          this.close();
          this.removeFromOngoingMatches(this.ID);
          this.postMatchStrategy.getOnDone(this.matchType)(this);
        }
      }
    }, 16.66); // 60fps
  }

  // マッチのWSルームに観戦者として参加｡
  // プレイヤーもゲーム状態を受け取るためにこの関数を呼ぶ｡
  joinAsSpectator(userID: number) {
    usersJoin(this.wsServer, userID, this.roomName);
  }

  // ユーザーが退出した際の処理
  leave(userID: number) {
    if (userID in this.match.players) {
      // TODO: ユーザーがプレイヤーだった場合ゲームを終了させる
    }
    usersLeave(this.wsServer, userID, this.roomName);
  }

  // バーを動かす｡プレイヤーとして認識されていない場合は何もしない｡
  moveBar(playerID: number, playerAction: PlayerInput) {
    this.match.moveBar(playerID, playerAction);
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

  get matchID() {
    return this.ID;
  }

  get playerIDs() {
    return [this.match.players[0].id, this.match.players[1].id];
  }

  set playerID1(userId: number) {
    this.match.players[0].id = userId;
  }

  set playerID2(userId: number) {
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

  get winnerID() {
    if (this.match.winner === 'none') {
      return undefined;
    }
    return this.match.players[Match.sideIndex[this.match.winner]].id;
  }

  get loserID() {
    if (this.match.winner === 'none') {
      return undefined;
    }
    const loserSide = this.match.winner === 'right' ? 'left' : 'right';
    return this.match.players[Match.sideIndex[loserSide]].id;
  }
}
