import { Ball, Player, GameState, PlayerInput } from './game-state';

export class Match {
  // field
  readonly fieldWidth = 1920;
  readonly fieldHeight = 1080;
  // ball
  readonly ballRadius = 2 * Math.PI;
  readonly ballDx = 10;
  readonly ballDy = 10;
  // bar
  readonly barHeight = this.fieldHeight / 8;
  readonly barWidth = this.fieldWidth * 0.01;
  readonly barLeftX = this.fieldWidth * 0.1;
  readonly barRightX = this.fieldWidth * 0.9;
  readonly barDy = 20;

  ball: Ball;
  players: [Player, Player];

  constructor(sessionID1: string, sessionID2: string) {
    (this.ball = {
      position: { x: this.fieldWidth / 2, y: this.fieldHeight / 2 },
      velocity: { x: -0.6, y: 0.2 },
    }),
      (this.players = [
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
      ]);
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
    } else if (this.ball.position.y + this.ballRadius >= this.fieldHeight) {
      // 下の壁に反射
      // ball.verocity と壁との反射ベクトルを求める
    }

    // 左右の壁との判定
    if (this.ball.position.x <= 0) {
      // right の勝ち
      // ball を中央からランダム方向へ発射する｡
      this.ball = this.generateBall();
    } else if (this.ball.position.x >= this.fieldWidth) {
      // left の勝ち
      // ball を中央からランダム方向へ発射する｡
      this.ball = this.generateBall();
    }
  };

  // sessionID のバーをdir方向に動かす
  moveBar = (sessionID: string, input: PlayerInput): void => {
    const idx = this.getPlayerIdx(sessionID);
    if (idx < 0) {
      return;
    }
    const player = this.players[idx];

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
}
