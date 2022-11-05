import { Match } from './match';
import { Server, Socket } from 'socket.io';
import { PlayerInput } from './types/game-state';
import {
  generateFullRoomName,
  sendResultRoom,
  usersJoin,
  usersLeave,
} from 'src/utils/socket/SocketRoom';
import { v4 as uuidv4 } from 'uuid';

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

  getMatchID() {
    return this.ID;
  }

  // プレイヤーとして参加しているユーザーを返す
  getPlayerIDs() {
    return [this.match.players[0].id, this.match.players[1].id];
  }
}
