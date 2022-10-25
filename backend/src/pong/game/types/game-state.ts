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

export type PlayerSide = 'left' | 'right';

export type PlayerInput = {
  up: boolean;
  down: boolean;
};

export type PongWinner = PlayerSide | 'none';
