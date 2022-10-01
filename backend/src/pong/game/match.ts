import {
  Ball,
  Player,
  GameState,
  PlayerInput,
  PlayerSide,
  Vector2d,
} from './game-state';

export class Match {
  // field
  readonly fieldWidth = 1920;
  readonly fieldHeight = 1080;
  // ball
  readonly ballRadius = 6;
  readonly ballDx = 2;
  readonly ballDy = 2;
  // bar
  readonly barHeight = this.fieldHeight / 8;
  readonly barWidth = this.fieldWidth * 0.01;
  readonly barLeftX = this.fieldWidth * 0.1;
  readonly barRightX = this.fieldWidth * 0.9;
  readonly barDy = 10;

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
    const newBallPos = this.ball.position;
    newBallPos.x += this.ball.velocity.x * this.ballDx;
    newBallPos.y += this.ball.velocity.y * this.ballDy;

    // 左右の壁との判定
    if (this.ball.position.x <= 0) {
      // right の勝ち
      this.players[this.getPlayerIdxBySide('right')].score++;
      this.ball = this.generateBall();
    } else if (this.ball.position.x >= this.fieldWidth) {
      // left の勝ち
      this.players[this.getPlayerIdxBySide('left')].score++;
      this.ball = this.generateBall();
    }

    // バーとの判定
    for (let idx = 0; idx < 2; idx++) {
      const player = this.players[idx];

      // ボールの4つの頂点
      const ballTopLeft: Vector2d = {
        x: newBallPos.x - this.ballRadius,
        y: newBallPos.y - this.ballRadius,
      };
      const ballTopRight: Vector2d = {
        x: newBallPos.x + this.ballRadius,
        y: newBallPos.y - this.ballRadius,
      };
      const ballBottomLeft: Vector2d = {
        x: newBallPos.x - this.ballRadius,
        y: newBallPos.y + this.ballRadius,
      };
      const ballBotttomRight: Vector2d = {
        x: newBallPos.x + this.ballRadius,
        y: newBallPos.y + this.ballRadius,
      };
      // バーの4つの頂点
      const barTopLeft: Vector2d = player.bar.topLeft;
      const barTopRight: Vector2d = {
        x: player.bar.bottomRight.x,
        y: player.bar.topLeft.y,
      };
      const barBottomLeft: Vector2d = {
        x: player.bar.topLeft.x,
        y: player.bar.bottomRight.y,
      };
      const barBotttomRight: Vector2d = player.bar.bottomRight;

      if (
        this.determineIntersection(
          ballTopLeft,
          ballTopRight,
          barTopLeft,
          barBottomLeft
        ) ||
        this.determineIntersection(
          ballBottomLeft,
          ballBotttomRight,
          barTopLeft,
          barBottomLeft
        ) ||
        this.determineIntersection(
          ballTopLeft,
          ballTopRight,
          barTopRight,
          barBotttomRight
        ) ||
        this.determineIntersection(
          ballBottomLeft,
          ballBotttomRight,
          barTopRight,
          barBotttomRight
        )
      ) {
        // バーの縦線に衝突
        this.ball.velocity.x *= -1;
      } else if (
        this.determineIntersection(
          ballTopLeft,
          ballBottomLeft,
          barTopLeft,
          barTopRight
        ) ||
        this.determineIntersection(
          ballTopRight,
          ballBotttomRight,
          barTopLeft,
          barTopRight
        ) ||
        this.determineIntersection(
          ballTopLeft,
          ballBottomLeft,
          barBottomLeft,
          barBotttomRight
        ) ||
        this.determineIntersection(
          ballTopRight,
          ballBotttomRight,
          barBottomLeft,
          barBotttomRight
        )
      ) {
        // バーの横線に衝突
        this.ball.velocity.y *= -1;
      }
    }

    // 上下の壁との判定
    if (
      newBallPos.y - this.ballRadius <= 0 ||
      newBallPos.y + this.ballRadius >= this.fieldHeight
    ) {
      this.ball.velocity.y *= -1;
    }

    this.ball.position.x += this.ballDx * this.ball.velocity.x;
    this.ball.position.y += this.ballDy * this.ball.velocity.y;
  };

  // sessionID のバーをdir方向に動かす
  moveBar = (sessionID: string, input: PlayerInput): void => {
    // const idx = this.getPlayerIdx(sessionID);
    // if (idx < 0) {
    //   return;
    // }
    // this.players[idx].input = input;
    // デバッグ用に両方のプレイヤーに操作を反映する
    for (let idx = 0; idx < 2; idx++) {
      this.players[idx].input = input;
    }
  };

  // 現在のプレイヤーのキー入力をもとにバーの位置を更新する
  // TODO: プレイヤーが左右に移動中にバーの上下面にボールが衝突したとき､ボールがバーの中に入ってしまう｡
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

  // 2つの線分の交差判定
  // 線分1: a, b
  // 線分2: c, d
  // https://qiita.com/zu_rin/items/e04fdec4e3dec6072104
  private determineIntersection = (
    a: Vector2d,
    b: Vector2d,
    c: Vector2d,
    d: Vector2d
  ): boolean => {
    let s: number;
    let t: number;
    s = (a.x - b.x) * (c.y - a.y) - (a.y - b.y) * (c.x - a.x);
    t = (a.x - b.x) * (d.y - a.y) - (a.y - b.y) * (d.x - a.x);
    if (s * t > 0) {
      return false;
    }

    s = (c.x - d.x) * (a.y - c.y) - (c.y - d.y) * (a.x - c.x);
    t = (c.x - d.x) * (b.y - c.y) - (c.y - d.y) * (b.x - c.x);
    if (s * t > 0) {
      return false;
    }
    return true;
  };
}
