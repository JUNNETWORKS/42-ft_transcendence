import { GameSettings } from './game-settings';
import {
  Ball,
  Player,
  GameState,
  PlayerInput,
  PlayerSide,
  Vector2d,
  Rectangle,
  makeFullRectangle,
  FullRectangle,
  makeEdge,
  areRangesOverlap,
} from './game-state';

export class Match {
  // field
  readonly fieldWidth = 1920;
  readonly fieldHeight = 1080;
  // ball
  readonly ballRadius = 6;
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
    this.ball = this.regenerateBall();
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

  // ゲーム状態を更新
  update = (): void => {
    this.updateBall();
    this.updateBar();
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

  // 現在のゲームの状態を返す
  getState = (): GameState => {
    const state: GameState = {
      ball: this.ball,
      players: this.players,
    };
    return state;
  };

  // ゲームの設定を返す
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

  // 中央からランダムな方向へボールを飛ばす
  private regenerateBall = (): Ball => {
    const rad = Math.random() * (2 * Math.PI);
    const position = { x: this.fieldWidth / 2, y: this.fieldHeight / 2 };
    const velocity = { x: Math.cos(rad), y: Math.sin(rad) };
    if (velocity.x < 0) {
      velocity.x = -velocity.x;
    }
    return {
      position,
      velocity,
    };
  };

  // ball の位置を更新する
  private updateBall = (): void => {
    // 左右の壁との判定
    if (this.ball.position.x <= 0) {
      // right の勝ち
      this.players[this.getPlayerIdxBySide('right')].score++;
      this.ball = this.regenerateBall();
      return;
    } else if (this.ball.position.x >= this.fieldWidth) {
      // left の勝ち
      this.players[this.getPlayerIdxBySide('left')].score++;
      this.ball = this.regenerateBall();
      return;
    }

    let newVelocity: Vector2d = JSON.parse(JSON.stringify(this.ball.velocity));
    const newBallPos: Vector2d = JSON.parse(JSON.stringify(this.ball.position));
    newBallPos.x += this.ball.velocity.x * this.ballDx;
    newBallPos.y += this.ball.velocity.y * this.ballDy;

    // バーとの判定
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
    const velocityMag = Math.sqrt(
      newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y
    );
    /**
     * ベクトル`r`を, "ベクトル`newVlocity`が(+1, 0)を向くような回転変換"により回転したものを返す.
     * @param
     * @returns
     */
    const rot = (r: Vector2d): Vector2d => {
      return {
        x: (r.x * newVelocity.x + r.y * newVelocity.y) / velocityMag,
        y: (r.x * -newVelocity.y + r.y * newVelocity.x) / velocityMag,
      };
    };
    /**
     * フル長方形`re`を, "ベクトル`newVlocity`が(+1, 0)を向くような回転変換"により回転したものを返す.
     * @param
     * @returns
     */
    const rotRect = (re: FullRectangle): FullRectangle => {
      return {
        topLeft: rot(re.topLeft),
        bottomRight: rot(re.bottomRight),
        topRight: rot(re.topRight),
        bottomLeft: rot(re.bottomLeft),
      };
    };
    for (let idx = 0; idx < 2; idx++) {
      const player = this.players[idx];
      if (!this.isReactanglesOverlap(newBallRect, player.bar)) {
        continue;
      }
      // [ボールとバーの衝突判定]
      // 0. ボールとバーが重なることがわかっているものとする.
      //  - TODO: 速度が大きい場合, 単なる長方形オーバーラップだと貫通する可能性がある
      // 1. ボールがX軸正方向, つまり (+1, 0) に沿って動くように, 座標系を回転する.
      // 2. ボールとバーの四隅について, X座標を無視することにすると,
      //    衝突判定は "ボールとバーの1辺同士が交差するかどうか" を判定する問題になるので, それを解く.
      const rotatedBall = rotRect(makeFullRectangle(newBallRect));
      const rotatedBar = rotRect(makeFullRectangle(player.bar));
      if (newVelocity.x >= 0) {
        // 右側に進んでいる -> ボール右辺とバー左辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'right');
        const barSide = makeEdge(rotatedBar, 'y', 'left');
        if (areRangesOverlap(ballSide, barSide)) {
          newVelocity = {
            x: this.ball.velocity.x * -1,
            y: this.ball.velocity.y,
          };
          break;
        }
      } else {
        // 左側に進んでいる -> ボール左辺とバー右辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'left');
        const barSide = makeEdge(rotatedBar, 'y', 'right');
        if (areRangesOverlap(ballSide, barSide)) {
          newVelocity = {
            x: this.ball.velocity.x * -1,
            y: this.ball.velocity.y,
          };
          break;
        }
      }
      if (newVelocity.y <= 0) {
        // 上側に進んでいる -> ボール上辺とバー下辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'top');
        const barSide = makeEdge(rotatedBar, 'y', 'bottom');
        if (areRangesOverlap(ballSide, barSide)) {
          newVelocity = {
            x: this.ball.velocity.x,
            y: this.ball.velocity.y * -1,
          };
          break;
        }
      } else {
        // 下側に進んでいる -> ボール下辺とバー上辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'bottom');
        const barSide = makeEdge(rotatedBar, 'y', 'top');
        if (areRangesOverlap(ballSide, barSide)) {
          newVelocity = {
            x: this.ball.velocity.x,
            y: this.ball.velocity.y * -1,
          };
          break;
        }
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

  // 現在のプレイヤーのキー入力をもとにバーの位置を更新する
  private updateBar = (): void => {
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

  // 長方形同士が重なっているか判定する
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
