import { GameSettings } from './types/game-settings';
import {
  Ball,
  Player,
  GameState,
  PlayerInput,
  PlayerSide,
  Vector2d,
  Rectangle,
  FullRectangle,
  PongWinner,
} from './types/game-state';

// ゲームの状態､更新のみに責任を持つ｡
export class Match {
  // field
  static readonly fieldWidth = 1920;
  static readonly fieldHeight = 1080;
  // ball
  static readonly ballRadius = 6;
  static readonly ballDx = 10;
  static readonly ballDy = 10;
  // bar
  static readonly barHeight = Match.fieldHeight / 8;
  static readonly barWidth = Match.fieldWidth * 0.01;
  static readonly barLeftX = Match.fieldWidth * 0.1;
  static readonly barRightX = Match.fieldWidth * 0.9;
  static readonly barDy = 10;
  //rule
  static readonly maxScore = 50000;
  static readonly kickoffMaxAngle = 60; // in degree

  static readonly sideIndex = {
    left: 0,
    right: 1,
  };

  ball: Ball;
  players: [Player, Player];
  winner: PongWinner;

  constructor(playerID1: number, playerID2: number) {
    this.winner = 'none';
    this.ball = this.regenerateBall();
    this.players = [
      {
        id: playerID1,
        side: 'left',
        score: 0,
        bar: {
          topLeft: {
            x: Match.barLeftX - Match.barWidth / 2,
            y: Match.fieldHeight / 2 - Match.barHeight / 2,
          },
          bottomRight: {
            x: Match.barLeftX + Match.barWidth / 2,
            y: Match.fieldHeight / 2 + Match.barHeight / 2,
          },
        },
        input: {
          up: false,
          down: false,
        },
      },
      {
        id: playerID2,
        side: 'right',
        score: 0,
        bar: {
          topLeft: {
            x: Match.barRightX - Match.barWidth / 2,
            y: Match.fieldHeight / 2 - Match.barHeight / 2,
          },
          bottomRight: {
            x: Match.barRightX + Match.barWidth / 2,
            y: Match.fieldHeight / 2 + Match.barHeight / 2,
          },
        },
        input: {
          up: false,
          down: false,
        },
      },
    ];
  }

  // 中央からランダムな方向へボールを飛ばす
  regenerateBall = (): Ball => {
    const rad =
      (Math.random() * 2 - 1) * Match.kickoffMaxAngle * (Math.PI / 180);
    const position = { x: Match.fieldWidth / 2, y: Match.fieldHeight / 2 };
    const velocity = { x: Math.cos(rad), y: Math.sin(rad) };
    return {
      position,
      velocity,
    };
  };

  // ballとバーの位置を更新する
  update = (): void => {
    const roundWinner = this.roundWinnerExists();
    if (roundWinner === 'none') {
      this.updateBall();
    } else {
      this.updateScore(roundWinner);
      this.ball = this.regenerateBall();
    }
    this.updateBar();
  };

  roundWinnerExists = (): PongWinner => {
    // 左右の壁との判定
    if (this.ball.position.x <= 0) {
      // right の勝ち
      return 'right';
    } else if (this.ball.position.x >= Match.fieldWidth) {
      // left の勝ち
      return 'left';
    } else {
      return 'none';
    }
  };

  //ゲームのスコア、勝敗を管理する
  updateScore = (side: PlayerSide) => {
    const index = Match.sideIndex[side];
    this.players[index].score++;
    if (this.players[index].score >= Match.maxScore) {
      this.winner = side;
    }
  };

  // ball の位置を更新する
  updateBall = (): void => {
    let newVelocity: Vector2d = JSON.parse(JSON.stringify(this.ball.velocity));
    const newBallPos: Vector2d = JSON.parse(JSON.stringify(this.ball.position));
    newBallPos.x += this.ball.velocity.x * Match.ballDx;
    newBallPos.y += this.ball.velocity.y * Match.ballDy;

    // バーとの判定
    const newBallRect: Rectangle = {
      topLeft: {
        x: newBallPos.x - Match.ballRadius,
        y: newBallPos.y - Match.ballRadius,
      },
      bottomRight: {
        x: newBallPos.x + Match.ballRadius,
        y: newBallPos.y + Match.ballRadius,
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
      newBallPos.y - Match.ballRadius <= 0 ||
      newBallPos.y + Match.ballRadius >= Match.fieldHeight
    ) {
      newVelocity = { x: this.ball.velocity.x, y: this.ball.velocity.y * -1 };
    }

    this.ball.velocity = newVelocity;
    this.ball.position.x += Match.ballDx * this.ball.velocity.x;
    this.ball.position.y += Match.ballDy * this.ball.velocity.y;
  };

  // playerID のバーをdir方向に動かす
  moveBar = (playerID: number, input: PlayerInput): void => {
    const idx = this.getPlayerIdx(playerID);
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
        dy = Math.min(
          Match.fieldHeight - player.bar.bottomRight.y,
          Match.barDy
        );
      } else if (input.up) {
        dy = Math.max(-player.bar.topLeft.y, -Match.barDy);
      }

      // ボールにバーがめり込まない場合のみバーを移動させる
      const ballRectangle: Rectangle = {
        topLeft: {
          x: this.ball.position.x - Match.ballRadius,
          y: this.ball.position.y - Match.ballRadius,
        },
        bottomRight: {
          x: this.ball.position.x + Match.ballRadius,
          y: this.ball.position.y + Match.ballRadius,
        },
      };
      const nextBallRectangle: Rectangle = {
        topLeft: {
          x:
            this.ball.position.x +
            this.ball.velocity.x * Match.ballDx -
            Match.ballRadius,
          y:
            this.ball.position.y +
            this.ball.velocity.y * Match.ballDy -
            Match.ballRadius,
        },
        bottomRight: {
          x:
            this.ball.position.x +
            this.ball.velocity.x * Match.ballDx +
            Match.ballRadius,
          y:
            this.ball.position.y +
            this.ball.velocity.y * Match.ballDy +
            Match.ballRadius,
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
        width: Match.fieldWidth,
        height: Match.fieldWidth,
      },
      ball: {
        radius: Match.ballRadius,
        dx: Match.ballDx,
        dy: Match.ballDy,
      },
    };
  };

  private getPlayerIdx = (playerID: number): number => {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id == playerID) {
        return i;
      }
    }
    return -1;
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

function makeFullRectangle(rect: Rectangle): FullRectangle {
  return {
    topLeft: {
      ...rect.topLeft,
    },
    bottomRight: {
      ...rect.bottomRight,
    },
    topRight: {
      x: rect.bottomRight.x,
      y: rect.topLeft.y,
    },
    bottomLeft: {
      x: rect.topLeft.x,
      y: rect.bottomRight.y,
    },
  };
}

/**
 * FullRectangle から, 上下左右のうち指定した辺を表す要素数2の配列を返す
 * (ただしx成分かy成分のみ)
 * @param rect
 * @param xy
 * @param dir
 * @returns
 */
function makeEdge(
  rect: FullRectangle,
  xy: 'x' | 'y',
  dir: 'top' | 'bottom' | 'left' | 'right'
): [number, number] {
  switch (dir) {
    case 'top':
      return sort2array([rect.topLeft[xy], rect.topRight[xy]]);
    case 'bottom':
      return sort2array([rect.bottomLeft[xy], rect.bottomRight[xy]]);
    case 'left':
      return sort2array([rect.topLeft[xy], rect.bottomLeft[xy]]);
    case 'right':
      return sort2array([rect.topRight[xy], rect.bottomRight[xy]]);
  }
}

/**
 * 2つの区間`range1`, `range2`が共通部分を持つかどうか(exclusive)を返す
 * @param range1
 * @param range2
 * @returns
 */
function areRangesOverlap(range1: [number, number], range2: [number, number]) {
  return !(range1[1] < range2[0] || range2[1] < range1[0]);
}

function sort2array<T>(arr2: [T, T]): [T, T] {
  if (arr2[0] > arr2[1]) {
    return [arr2[1], arr2[0]];
  }
  return [...arr2];
}
