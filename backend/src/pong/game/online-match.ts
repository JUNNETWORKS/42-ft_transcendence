import { Match } from './match';
import { Server, Socket } from 'socket.io';
import { PlayerInput } from './types/game-state';

// このクラスは以下に対して責任を持つ
// - マッチの保持
// - マッチのWSルームを作成
// - setInterval() で作成されるTimerIDの保持
export class OnlineMatch {
  // マッチID
  private ID: string;
  private match: Match;
  private gameStateSyncTimer: NodeJS.Timer;
  // TODO: 本来はコンストラクタで渡されるのでnullにはならない｡
  wsServer: Server | null;

  constructor() {
    this.ID = 'MatchID';
    this.match = new Match('', '');
    this.gameStateSyncTimer = setInterval(() => {
      this.match.update();

      if (this.wsServer) {
        this.wsServer
          .to(this.generateRoomID())
          .emit('pong.match.state', this.match.getState());
      }
    }, 16.66); // 60fps
  }

  // マッチのWSルームに観戦者として参加｡
  // プレイヤーもゲーム状態を受け取るためにこの関数を呼ぶ｡
  joinAsSpectator = (client: Socket) => {
    client.join(this.generateRoomID());
  };

  // マッチにプレイヤーとして参加 (先着2名)
  // TODO: 2人プレイのテスト用で作成している関数｡後で消す｡
  joinAsPlayer = (client: Socket) => {
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
  };

  // プレイヤーが退出した際の処理
  leave = (client: Socket) => {
    if (this.match.players[0].id === client.id) {
      console.log(`player1#${client.id} has left!\n`);
      this.match.players[0].id = '';
    } else if (this.match.players[1].id === client.id) {
      console.log(`player2#${client.id} has left!\n`);
      this.match.players[1].id = '';
    }
  };

  // バーを動かす｡プレイヤーとして認識されていない場合は何もしない｡
  moveBar = (playerID: string, playerAction: PlayerInput) => {
    this.match.moveBar(playerID, playerAction);
  };

  // WSルームIDを取得
  generateRoomID = () => {
    return `Match#${this.ID}`;
  };

  // ゲームを終了
  close = () => {
    clearInterval(this.gameStateSyncTimer);
  };
}
