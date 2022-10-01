import { Ball, Player, GameState, PlayerInput, PlayerSide } from './game-state';

export class Match {
  // field
  readonly fieldWidth = 1920;
  readonly fieldHeight = 1080;
  // ball
  readonly ballRadius = 2 * Math.PI;
  readonly ballDx = 5;
  readonly ballDy = 5;
  // bar
  readonly barHeight = this.fieldHeight / 8;
  readonly barWidth = this.fieldWidth * 0.01;
  readonly barLeftX = this.fieldWidth * 0.1;
  readonly barRightX = this.fieldWidth * 0.9;
  readonly barDy = 5;

  ball: Ball;
  players: [Player, Player];

  constructor(sessionID1: string, sessionID2: string) {
    this.ball = this.generateBall();
    this.players = [
      {
        id: sessionID1,
        side: 'left',
        score: 0,
        bar: {
          topLeft: {
            x: this.barLeftX - this.barWidth / 2,
            y: this.fieldHeight / 2 - this.barHeight / 2,
          },
          bottomRight: {
            x: this.barLeftX + this.barWidth / 2,
            y: this.fieldHeight / 2 + this.barHeight / 2,
          },
        },
        input: {
          up: false,
          down: false,
        },
      },
      {
        id: sessionID2,
        side: 'right',
        score: 0,
        bar: {
          topLeft: {
            x: this.barRightX - this.barWidth / 2,
            y: this.fieldHeight / 2 - this.barHeight / 2,
          },
          bottomRight: {
            x: this.barRightX + this.barWidth / 2,
            y: this.fieldHeight / 2 + this.barHeight / 2,
          },
        },
        input: {
          up: false,
          down: false,
        },
      },
    ];
  }

  generateBall = (): Ball => {
    const rad = Math.random() * 2 * Math.PI;
    return {
      position: { x: this.fieldWidth / 2, y: this.fieldHeight / 2 },
      velocity: { x: Math.cos(rad), y: Math.sin(rad) },
    };
  };

  // ball の位置を更新する
  updateBall = (): void => {
    this.ball.position.x += this.ball.velocity.x * this.ballDx;
    this.ball.position.y += this.ball.velocity.y * this.ballDy;

    // TODO: バーとの判定

    // TODO: 上下の壁との判定
    if (this.ball.position.y - this.ballRadius <= 0) {
      // 上の壁に反射
      // ball.verocity と壁との反射ベクトルを求める
      this.ball = this.generateBall();
    } else if (this.ball.position.y + this.ballRadius >= this.fieldHeight) {
      // 下の壁に反射
      // ball.verocity と壁との反射ベクトルを求める
      this.ball = this.generateBall();
    }

    // 左右の壁との判定
    if (this.ball.position.x <= 0) {
      // right の勝ち
      // ball を中央からランダム方向へ発射する｡
      this.players[this.getPlayerIdxBySide('right')].score++;
      this.ball = this.generateBall();
    } else if (this.ball.position.x >= this.fieldWidth) {
      // left の勝ち
      // ball を中央からランダム方向へ発射する｡
      this.players[this.getPlayerIdxBySide('left')].score++;
      this.ball = this.generateBall();
    }
  };

  // sessionID のバーをdir方向に動かす
  moveBar = (sessionID: string, input: PlayerInput): void => {
    const idx = this.getPlayerIdx(sessionID);
    if (idx < 0) {
      return;
    }
    this.players[idx].input = input;
  };

  // 現在のプレイヤーのキー入力をもとにバーの位置を更新する
  updateBar = (): void => {
    for (let idx = 0; idx < 2; idx++) {
      const player = this.players[idx];
      const input = player.input;

      // y=0 がフィールド上部である点に注意
      let dy = 0;
      if (input.down) {
        if (player.bar.bottomRight.y + this.barDy > this.fieldHeight) {
          dy = this.fieldHeight - player.bar.bottomRight.y;
        } else {
          dy = this.barDy;
        }
      } else if (input.up) {
        if (player.bar.topLeft.y - this.barDy < 0) {
          dy = -player.bar.topLeft.y;
        } else {
          dy = -this.barDy;
        }
      }
      player.bar.topLeft.y += dy;
      player.bar.bottomRight.y += dy;

      this.players[idx] = player;
    }
  };

  // 現在のゲームの状態を返す
  getState = (): GameState => {
    const state: GameState = {
      ball: this.ball,
      players: this.players,
    };
    return state;
  };

  private getPlayerIdx = (sessionID: string): number => {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id == sessionID) {
        return i;
      }
    }
    return -1;
  };

  private getPlayerIdxBySide = (side: PlayerSide): number => {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].side == side) {
        return i;
      }
    }
    return -1;
  };
}
