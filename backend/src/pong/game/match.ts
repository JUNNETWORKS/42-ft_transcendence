import { isfinite } from 'src/utils';

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
  static readonly defaultConfig = { maxScore: 15, speed: 100 };
  static readonly kickoffMaxAngle = 60; // in degree

  static readonly sideIndex = {
    left: 0,
    right: 1,
  };

  ball: Ball;
  players: [Player, Player];
  winner: PongWinner;
  maxScore: number;
  speed: number;

  constructor(
    playerId1: number,
    playerId2: number,
    config: { maxScore: number; speed: number } = Match.defaultConfig
  ) {
    this.maxScore = config.maxScore;
    this.speed = config.speed;
    this.winner = 'none';
    this.ball = this.regenerateBall();
    this.players = [
      {
        id: playerId1,
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
        id: playerId2,
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
    const velocity = {
      x: (this.speed / 100) * Math.cos(rad),
      y: (this.speed / 100) * Math.sin(rad),
    };
    return {
      position,
      velocity,
    };
  };

  // ballとバーの位置を更新する
  update = () => {
    let scoreHasChanged = false;
    let hasEnded = false;
    const roundWinner = this.roundWinnerExists();
    if (roundWinner === 'none') {
      this.updateBall();
    } else {
      this.updateScore(roundWinner);
      hasEnded = this.winner !== 'none';
      this.ball = this.regenerateBall();
      scoreHasChanged = true;
    }
    this.updateBar();
    return { hasEnded, scoreHasChanged };
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
    if (this.players[index].score >= this.maxScore) {
      this.winner = side;
    }
  };

  makeBallRect(center: Vector2d): Rectangle {
    return {
      topLeft: {
        x: center.x - Match.ballRadius,
        y: center.y - Match.ballRadius,
      },
      bottomRight: {
        x: center.x + Match.ballRadius,
        y: center.y + Match.ballRadius,
      },
    };
  }

  // ball の位置を更新する
  updateBall = (): void => {
    let newVelocity: Vector2d = JSON.parse(JSON.stringify(this.ball.velocity));
    const newBallPos: Vector2d = JSON.parse(JSON.stringify(this.ball.position));
    newBallPos.x += this.ball.velocity.x * Match.ballDx;
    newBallPos.y += this.ball.velocity.y * Match.ballDy;
    const ballRect = this.makeBallRect(this.ball.position);

    // バーとの判定
    const newBallRect = this.makeBallRect(newBallPos);
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
    let tx = Infinity;
    let ty = Infinity;
    let bcx = NaN;
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
      if (newVelocity.x > 0) {
        // 右側に進んでいる -> ボール右辺とバー左辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'right');
        const barSide = makeEdge(rotatedBar, 'y', 'left');
        if (areRangesOverlap(ballSide, barSide)) {
          const dx = player.bar.topLeft.x - ballRect.bottomRight.x;
          const vx = newVelocity.x;
          tx = Math.abs(dx / vx);
          bcx = (player.bar.topLeft.y + player.bar.bottomRight.y) / 2;
        }
      } else if (newVelocity.x < 0) {
        // 左側に進んでいる -> ボール左辺とバー右辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'left');
        const barSide = makeEdge(rotatedBar, 'y', 'right');
        if (areRangesOverlap(ballSide, barSide)) {
          const dx = player.bar.bottomRight.x - ballRect.topLeft.x;
          const vx = newVelocity.x;
          tx = Math.abs(dx / vx);
          bcx = (player.bar.topLeft.y + player.bar.bottomRight.y) / 2;
        }
      }
      if (newVelocity.y < 0) {
        // 上側に進んでいる -> ボール上辺とバー下辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'top');
        const barSide = makeEdge(rotatedBar, 'y', 'bottom');
        if (areRangesOverlap(ballSide, barSide)) {
          const dy = player.bar.bottomRight.y - ballRect.topLeft.y;
          const vy = newVelocity.y;
          ty = Math.abs(dy / vy);
        }
      } else if (newVelocity.y > 0) {
        // 下側に進んでいる -> ボール下辺とバー上辺の衝突を判定する
        const ballSide = makeEdge(rotatedBall, 'y', 'bottom');
        const barSide = makeEdge(rotatedBar, 'y', 'top');
        if (areRangesOverlap(ballSide, barSide)) {
          const dy = player.bar.topLeft.y - ballRect.bottomRight.y;
          const vy = newVelocity.y;
          ty = Math.abs(dy / vy);
        }
      }
    }

    if (tx <= ty && isfinite(tx)) {
      // X方向反射 → 角度揺らぎがある
      newVelocity.x = -newVelocity.x;
      const v = Math.sqrt(newVelocity.x ** 2 + newVelocity.y ** 2);
      const deltaPi = (Math.PI / 180) * 30;
      const ballCenter = this.ball.position.y + newVelocity.y * tx;
      const r = ((ballCenter - bcx) * 2) / Match.barHeight;
      const r4 = r ** 4;
      const deltaPhi = (Math.PI / 180) * 180 * r4 * (Math.random() / 2 - 1);
      const rev = newVelocity.x > 0 ? +1 : -1;
      const pphi = Math.atan2(newVelocity.y, rev * newVelocity.x);
      const phi = cramp(
        -Math.PI / 2 + deltaPi,
        pphi + deltaPhi,
        Math.PI / 2 - deltaPi
      );
      newVelocity = {
        x: rev * v * Math.cos(phi),
        y: v * Math.sin(phi),
      };
    } else if (ty <= tx && isfinite(ty)) {
      // Y方向反射 → 揺らがせない
      newVelocity.y = -newVelocity.y;
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

  // playerId のバーをdir方向に動かす
  moveBar = (playerId: number, input: PlayerInput): void => {
    const idx = this.getPlayerIdx(playerId);
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

  private getPlayerIdx = (playerId: number): number => {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id == playerId) {
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

function cramp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x));
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
