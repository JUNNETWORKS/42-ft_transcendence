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
  bar: Bar;
  input: PlayerInput; // ユーザー入力
};

export type Bar = {
  topLeft: Vector2d; // バーの左上の座標
  bottomRight: Vector2d; // バーの右下の座標
};
export type PlayerSide = 'left' | 'right';
export type PlayerInput = {
  up: boolean;
  down: boolean;
};
