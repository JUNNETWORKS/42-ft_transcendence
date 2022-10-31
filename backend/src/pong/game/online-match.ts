import { Match } from './match';
import { Server, Socket } from 'socket.io';
import { PlayerInput } from './types/game-state';
import {
  generateFullRoomName,
  joinChannel,
  sendResultRoom,
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

  constructor(wsServer: Server) {
    this.wsServer = wsServer;
    this.ID = uuidv4();
    this.roomName = generateFullRoomName({ matchId: this.ID });
    this.match = new Match(0, 0);
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
  joinAsSpectator(client: Socket) {
    joinChannel(client, this.roomName);
  }

  // マッチにプレイヤーとして参加 (先着2名)
  // TODO: 2人プレイのテスト用で作成している関数｡後で消す｡
  joinAsPlayer(playerID: number) {
    if (
      this.match.players[0].id === playerID ||
      this.match.players[1].id === playerID
    ) {
      // すでにプレイヤーとして参加済み
      return;
    }

    if (this.match.players[0].id === 0) {
      console.log(`session#${playerID} has joined as player1!\n`);
      this.match.players[0].id = playerID;
    } else if (this.match.players[1].id === 0) {
      this.match.players[1].id = playerID;
      console.log(`session#${playerID} has joined as player2!\n`);
    }
  }

  // プレイヤーが退出した際の処理
  leave(playerID: number) {
    if (this.match.players[0].id === playerID) {
      console.log(`player1#${playerID} has left!\n`);
      this.match.players[0].id = 0;
    } else if (this.match.players[1].id === playerID) {
      console.log(`player2#${playerID} has left!\n`);
      this.match.players[1].id = 0;
    }
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
