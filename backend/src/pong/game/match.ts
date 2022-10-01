import { GameSettings } from './game-settings';
import {
  Ball,
  Player,
  GameState,
  PlayerInput,
  PlayerSide,
  Vector2d,
  Bar,
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
  // TODO: ボールが移動先にあるときは移動できない
  updateBall = (): void => {
    let newVelocity = { ...this.ball.velocity };
    const newBallPos = { ...this.ball.position };
    newBallPos.x += this.ball.velocity.x * this.ballDx;
    newBallPos.y += this.ball.velocity.y * this.ballDy;

    // 左右の壁との判定
    if (this.ball.position.x <= 0) {
      // right の勝ち
      this.players[this.getPlayerIdxBySide('right')].score++;
      this.ball = this.generateBall();
      return;
    } else if (this.ball.position.x >= this.fieldWidth) {
      // left の勝ち
      this.players[this.getPlayerIdxBySide('left')].score++;
      this.ball = this.generateBall();
      return;
    }

    // バーとの判定
    for (let idx = 0; idx < 2; idx++) {
      const player = this.players[idx];
      if (
        this.isBallCollidedWithVerticalBar(
          this.ball.position,
          newBallPos,
          player.bar,
          player.side
        )
      ) {
        // バーの左右面に衝突
        newVelocity = { x: this.ball.velocity.x * -1, y: this.ball.velocity.y };
      } else if (
        this.isBallCollidedWithHorizontalBar(
          this.ball.position,
          newBallPos,
          player.bar
        )
      ) {
        // バーの上下面に衝突
        newVelocity = { x: this.ball.velocity.x, y: this.ball.velocity.y * -1 };
      }
    }

    // 上下の壁との判定
    if (
      newBallPos.y - this.ballRadius <= 0 ||
      newBallPos.y + this.ballRadius >= this.fieldHeight
    ) {
      newVelocity = { x: this.ball.velocity.x, y: this.ball.velocity.y * -1 };
    }

    this.ball.velocity = newVelocity;
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

  getSettings = (): GameSettings => {
    return {
      field: {
        width: this.fieldWidth,
        height: this.fieldWidth,
      },
      ball: {
        radius: this.ballRadius,
        dx: this.ballDx,
        dy: this.ballDy,
      },
    };
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

  // バーの左右面にボールが衝突しているか
  // ballPos: 現在フレームのボールの座標
  // newBallPos: 次フレームのボールの座標
  // ballPos と newBall の移動分の線分とバーの面の線分との交差判定で判定する｡
  private isBallCollidedWithVerticalBar = (
    ballPos: Vector2d,
    newBallPos: Vector2d,
    bar: Bar,
    playerSide: PlayerSide
  ): boolean => {
    let barTop: Vector2d;
    let barBottom: Vector2d;
    if (playerSide == 'right') {
      barTop = bar.topLeft;
      barBottom = {
        x: bar.topLeft.x,
        y: bar.bottomRight.y,
      };
    } else {
      barTop = {
        x: bar.bottomRight.x,
        y: bar.topLeft.y,
      };
      barBottom = bar.bottomRight;
    }

    return this.determineIntersection(ballPos, newBallPos, barTop, barBottom);
  };

  // バーの上下面にボールが衝突しているか
  // ballPos: 現在フレームのボールの座標
  // newBallPos: 次フレームのボールの座標
  // ballPos と newBall の移動分の線分とバーの面の線分との交差判定で判定する｡
  private isBallCollidedWithHorizontalBar = (
    ballPos: Vector2d,
    newBallPos: Vector2d,
    bar: Bar
  ): boolean => {
    const barTopLeft: Vector2d = bar.topLeft;
    const barTopRight: Vector2d = {
      x: bar.bottomRight.x,
      y: bar.topLeft.y,
    };
    const barBottomLeft: Vector2d = {
      x: bar.topLeft.x,
      y: bar.bottomRight.y,
    };
    const barBottomRight: Vector2d = bar.bottomRight;

    return (
      this.determineIntersection(
        ballPos,
        newBallPos,
        barTopLeft,
        barTopRight
      ) ||
      this.determineIntersection(
        ballPos,
        newBallPos,
        barBottomLeft,
        barBottomRight
      )
    );
  };
}
