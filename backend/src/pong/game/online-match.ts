import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import {
  generateFullRoomName,
  sendResultRoom,
  usersJoin,
  usersLeave,
} from 'src/utils/socket/SocketRoom';

import { Match } from './match';
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
  private readonly gameStateSyncTimer: NodeJS.Timer;
  private readonly wsServer: Server;

  constructor(wsServer: Server, userID1: number, userID2: number) {
    this.wsServer = wsServer;
    this.ID = uuidv4();
    this.roomName = generateFullRoomName({ matchId: this.ID });
    this.match = new Match(userID1, userID2);
    this.joinAsSpectator(userID1);
    this.joinAsSpectator(userID2);
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

  getMatchID() {
    return this.ID;
  }

  // プレイヤーとして参加しているユーザーを返す
  getPlayerIDs() {
    return [this.match.players[0].id, this.match.players[1].id];
  }
}
