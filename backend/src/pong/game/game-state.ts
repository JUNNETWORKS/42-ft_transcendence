// サーバーから送信される現在のゲーム状態
export type GameState = {
  ball: Ball;
  players: [Player, Player];
};

export type Ball = {
  position: Vector2d;
  velocity: Vector2d;
};

export type Vector2d = {
  x: number;
  y: number;
};

export type Player = {
  id: string; // WebSocket ID
  side: PlayerSide; // ゲームの右左どちら側か
  score: number; // 現在のスコア
  bar: Rectangle;
  input: PlayerInput; // ユーザー入力
};

export type Rectangle = {
  topLeft: Vector2d; // 長方形の左上の座標
  bottomRight: Vector2d; // 長方形の右下の座標
};
export type FullRectangle = Rectangle & {
  topRight: Vector2d; // 長方形の右上の座標
  bottomLeft: Vector2d; // 長方形の左下の座標
};

export function makeFullRectangle(rect: Rectangle): FullRectangle {
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
export function makeEdge(
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
export function areRangesOverlap(
  range1: [number, number],
  range2: [number, number]
) {
  return !(range1[1] < range2[0] || range2[1] < range1[0]);
}

export type PlayerSide = 'left' | 'right';
export type PlayerInput = {
  up: boolean;
  down: boolean;
};

function sort2array<T>(arr2: [T, T]): [T, T] {
  if (arr2[0] > arr2[1]) {
    return [arr2[1], arr2[0]];
  }
  return [...arr2];
}
