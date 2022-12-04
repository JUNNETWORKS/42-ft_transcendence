// サーバー側で保持しているゲーム中に変化しない情報
// サーバーでの計算に用いる情報フィールドサイズ
// これとcanvasサイズの比を書けて描画する｡
// クライアント側はアスペクト比は必ずこれと同じ必要がある｡
export type GameSettings = {
  field: {
    width: number;
    height: number;
  };
  ball: {
    radius: number;
    dx: number;
    dy: number;
  };
};

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
  bar: {
    topLeft: Vector2d; // バーの左上の座標
    bottomRight: Vector2d; // バーの右下の座標
  };
  input: PlayerInput; // ユーザー入力
};

// pong.match.action でサーバーに送信するデータ
export type PlayerAction = PlayerInput;

export type PlayerSide = 'left' | 'right';

export type PlayerInput = {
  up: boolean;
  down: boolean;
};

export type GameResult = {
  winner: Player;
  loser: Player;
};

export type UserForRanking = {
  rankPoint: number;
  user: {
    displayName: string;
    id: number;
    isEnabledAvatar: true;
  };
};
