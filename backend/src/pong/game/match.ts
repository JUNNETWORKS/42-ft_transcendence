import { HttpException, HttpStatus } from '@nestjs/common';
import { GameSettings } from './game-settings';
import {
  Ball,
  Player,
  GameState,
  PlayerInput,
  PlayerSide,
  Vector2d,
  Rectangle,
} from './game-state';

export class Match {
  // field
  readonly fieldWidth = 1920;
  readonly fieldHeight = 1080;
  // ball
  readonly ballRadius = 60;
  readonly ballDx = 10;
  readonly ballDy = 10;
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

    let newVelocity: Vector2d = JSON.parse(JSON.stringify(this.ball.velocity));
    const newBallPos: Vector2d = JSON.parse(JSON.stringify(this.ball.position));
    newBallPos.x += this.ball.velocity.x * this.ballDx;
    newBallPos.y += this.ball.velocity.y * this.ballDy;

    // バーとの判定
    for (let idx = 0; idx < 2; idx++) {
      const player = this.players[idx];
      if (
        this.isBallCollidedWithHorizontalBar(
          this.ball.position,
          newBallPos,
          player.bar,
          player.side
        )
      ) {
        // バーの上下面に衝突
        newVelocity = { x: this.ball.velocity.x, y: this.ball.velocity.y * -1 };
      } else if (
        this.isBallCollidedWithVerticalBar(
          this.ball.position,
          newBallPos,
          player.bar,
          player.side
        )
      ) {
        // バーの左右面に衝突
        newVelocity = { x: this.ball.velocity.x * -1, y: this.ball.velocity.y };
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
  updateBar = (): void => {
    for (let idx = 0; idx < 2; idx++) {
      const player = this.players[idx];
      const input = player.input;

      // y=0 がフィールド上部である点に注意
      let dy = 0;
      if (input.down) {
        dy = Math.min(this.fieldHeight - player.bar.bottomRight.y, this.barDy);
      } else if (input.up) {
        dy = Math.max(-player.bar.topLeft.y, -this.barDy);
      }

      // ボールにバーがめり込まない場合のみバーを移動させる
      const ballRectangle: Rectangle = {
        topLeft: {
          x: this.ball.position.x - this.ballRadius,
          y: this.ball.position.y - this.ballRadius,
        },
        bottomRight: {
          x: this.ball.position.x + this.ballRadius,
          y: this.ball.position.y + this.ballRadius,
        },
      };
      const nextBallRectangle: Rectangle = {
        topLeft: {
          x:
            this.ball.position.x +
            this.ball.velocity.x * this.ballDx -
            this.ballRadius,
          y:
            this.ball.position.y +
            this.ball.velocity.y * this.ballDy -
            this.ballRadius,
        },
        bottomRight: {
          x:
            this.ball.position.x +
            this.ball.velocity.x * this.ballDx +
            this.ballRadius,
          y:
            this.ball.position.y +
            this.ball.velocity.y * this.ballDy +
            this.ballRadius,
        },
      };
      // TODO: Node17以上にアップグレードして､structuredClone()を使えるようにする｡
      const newBarPos: Rectangle = JSON.parse(JSON.stringify(player.bar));
      newBarPos.topLeft.y += dy;
      newBarPos.bottomRight.y += dy;
      if (
        !this.isReactanglesOverlap(newBarPos, ballRectangle) &&
        !this.isReactanglesOverlap(newBarPos, nextBallRectangle)
      ) {
        this.players[idx].bar = newBarPos;
      }
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
    bar: Rectangle,
    playerSide: PlayerSide
  ): boolean => {
    const newBallRect: Rectangle = {
      topLeft: {
        x: newBallPos.x - this.ballRadius,
        y: newBallPos.y - this.ballRadius,
      },
      bottomRight: {
        x: newBallPos.x + this.ballRadius,
        y: newBallPos.y + this.ballRadius,
      },
    };

    if (
      this.isReactanglesOverlap(newBallRect, bar) &&
      !this.isBallCollidedWithHorizontalBar(
        ballPos,
        newBallPos,
        bar,
        playerSide
      )
    ) {
      return true;
    }
    return false;
  };

  // バーの上下面にボールが衝突しているか
  // ballPos: 現在フレームのボールの座標
  // newBallPos: 次フレームのボールの座標
  // ballPos と newBall の移動分の線分とバーの面の線分との交差判定で判定する｡
  private isBallCollidedWithHorizontalBar = (
    ballPos: Vector2d,
    newBallPos: Vector2d,
    bar: Rectangle,
    playerSide: PlayerSide
  ): boolean => {
    // 長方形の重なり判定によるバーの上下面の判定
    const newBallRect: Rectangle = {
      topLeft: {
        x: newBallPos.x - this.ballRadius,
        y: newBallPos.y - this.ballRadius,
      },
      bottomRight: {
        x: newBallPos.x + this.ballRadius,
        y: newBallPos.y + this.ballRadius,
      },
    };
    // smallRect が bigRect に衝突するのに合わせた処理になっている｡
    // ボールがバーの幅より小さい場合は smallRect がボール､ bigRect がバー になる｡
    let smallRect: Rectangle;
    let bigRect: Rectangle;
    if (this.ballRadius <= bar.bottomRight.x - bar.topLeft.x) {
      smallRect = newBallRect;
      bigRect = bar;
    } else {
      smallRect = bar;
      bigRect = newBallRect;
    }

    if (this.isReactanglesOverlap(smallRect, bigRect)) {
      const isSmallRectCollidedWithBigRectTopBottom =
        smallRect.topLeft.x >= bigRect.topLeft.x &&
        smallRect.bottomRight.x <= bigRect.bottomRight.x;
      const isSmallRectCollidedWithBigRectTopLeft =
        smallRect.bottomRight.x >= bigRect.bottomRight.x &&
        smallRect.topLeft.y <= bigRect.topLeft.y;
      const isSmallRectCollidedWithBigRectBottomLeft =
        smallRect.bottomRight.x >= bigRect.bottomRight.x &&
        smallRect.bottomRight.y >= bigRect.bottomRight.y;
      const isSmallRectCollidedWithBigRectTopRight =
        smallRect.topLeft.x <= bigRect.topLeft.x &&
        smallRect.topLeft.y <= bigRect.topLeft.y;
      const isSmallRectCollidedWithBigRectBottomRight =
        smallRect.topLeft.x <= bigRect.topLeft.x &&
        smallRect.bottomRight.y >= bigRect.bottomRight.y;

      if (playerSide === 'left') {
        return (
          isSmallRectCollidedWithBigRectTopBottom ||
          isSmallRectCollidedWithBigRectTopLeft ||
          isSmallRectCollidedWithBigRectBottomLeft
        );
      } else {
        return (
          isSmallRectCollidedWithBigRectTopBottom ||
          isSmallRectCollidedWithBigRectTopRight ||
          isSmallRectCollidedWithBigRectBottomRight
        );
      }
    }
    return false;
  };

  // 長方形動詞が重なっているか判定する
  // https://nihaoshijie.hatenadiary.jp/entry/2018/01/14/192201
  private isReactanglesOverlap = (
    rect1: Rectangle,
    rect2: Rectangle
  ): boolean => {
    if (
      Math.max(rect1.topLeft.x, rect2.topLeft.x) <=
        Math.min(rect1.bottomRight.x, rect2.bottomRight.x) &&
      Math.max(rect1.topLeft.y, rect2.topLeft.y) <=
        Math.min(rect1.bottomRight.y, rect2.bottomRight.y)
    ) {
      return true;
    }
    return false;
  };
}
