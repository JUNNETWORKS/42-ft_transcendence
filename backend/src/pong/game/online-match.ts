import { Match } from './match';
import { Server, Socket } from 'socket.io';
import { MatchResult, PlayerInput } from './types/game-state';
import {
  generateFullRoomName,
  joinChannel,
  sendResultRoom,
} from 'src/utils/socket/SocketRoom';
import { SIDE_INDEX } from './constants/match-constants';

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
  // TODO: 本来はコンストラクタで渡されるのでnullにはならない｡
  wsServer: Server | null;

  constructor() {
    this.ID = 'MatchID';
    this.roomName = generateFullRoomName({ matchId: this.ID });
    this.match = new Match('', '');
    this.gameStateSyncTimer = setInterval(() => {
      this.match.update();

      if (this.wsServer) {
        if (this.match.winner === 'none') {
          sendResultRoom(
            this.wsServer,
            'pong.match.state',
            this.roomName,
            this.match.getState()
          );
        } else {
          sendResultRoom(
            this.wsServer,
            'pong.match.state',
            this.roomName,
            this.match.getState()
          );

          const loserSide = this.match.winner === 'right' ? 'left' : 'right';
          const result: MatchResult = {
            winner: this.match.players[SIDE_INDEX[this.match.winner]],
            loser: this.match.players[SIDE_INDEX[loserSide]],
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
    }, 16.66); // 60fps
  }

  // マッチのWSルームに観戦者として参加｡
  // プレイヤーもゲーム状態を受け取るためにこの関数を呼ぶ｡
  joinAsSpectator(client: Socket) {
    joinChannel(client, this.roomName);
  }

  // マッチにプレイヤーとして参加 (先着2名)
  // TODO: 2人プレイのテスト用で作成している関数｡後で消す｡
  joinAsPlayer(client: Socket) {
    if (
      this.match.players[0].id === client.id ||
      this.match.players[1].id === client.id
    ) {
      // すでにプレイヤーとして参加済み
      return;
    }

    if (this.match.players[0].id === '') {
      console.log(`session#${client.id} has joined as player1!\n`);
      this.match.players[0].id = client.id;
    } else if (this.match.players[1].id === '') {
      this.match.players[1].id = client.id;
      console.log(`session#${client.id} has joined as player2!\n`);
    }
  }

  // プレイヤーが退出した際の処理
  leave(client: Socket) {
    if (this.match.players[0].id === client.id) {
      console.log(`player1#${client.id} has left!\n`);
      this.match.players[0].id = '';
    } else if (this.match.players[1].id === client.id) {
      console.log(`player2#${client.id} has left!\n`);
      this.match.players[1].id = '';
    }
  }

  // バーを動かす｡プレイヤーとして認識されていない場合は何もしない｡
  moveBar(playerID: string, playerAction: PlayerInput) {
    this.match.moveBar(playerID, playerAction);
  }

  // ゲームを終了
  close() {
    clearInterval(this.gameStateSyncTimer);
  }
}
