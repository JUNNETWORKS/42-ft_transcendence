import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { GameResult, GameSettings, GameState } from '../types';
import { useCanvasSize } from './useCanvasSize';

const pongBlack = '#000000';
const pongWhite = '#FFFFFE';

const staticGameSettings = {
  field: { width: 1920, height: 1080 },
  ball: { radius: 6, dx: 2, dy: 2 },
};

const drawCenteringText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth?: number
) => {
  const textSize = ctx.measureText(text).width;
  const drawingSize = maxWidth && maxWidth < textSize ? maxWidth : textSize;
  const x = centerX - drawingSize / 2;

  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y, maxWidth);
  ctx.textBaseline = 'alphabetic';
};

const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.clearRect(0, 0, width, height);
};

// ゲームの背景を描画する
const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  // 背景枠
  ctx.fillStyle = pongWhite;
  ctx.fillRect(0, 0, width, height);
  //背景色
  const bezelSize = 5;
  ctx.fillStyle = pongBlack;
  ctx.fillRect(
    bezelSize,
    bezelSize,
    width - bezelSize * 2,
    height - bezelSize * 2
  );

  //中央破線
  const dashedLineHeight = 25;
  const dashedLineWidth = 15;

  ctx.fillStyle = pongWhite;
  for (let startY = 0; startY < height; startY += dashedLineHeight * 2) {
    const startX = width / 2 - dashedLineWidth / 2;
    ctx.fillRect(startX, startY, dashedLineWidth, dashedLineHeight);
  }
};

const drawScore = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  { players }: GameState
) => {
  // スコア
  ctx.font = '160px PixelMplus';
  ctx.fillStyle = pongWhite;
  const y = height * 0.25;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const x = player.side === 'left' ? width / 2 - 400 : width / 2 + 400;

    drawCenteringText(ctx, player.score.toString(), x, y);
  }
};

const drawBar = (ctx: CanvasRenderingContext2D, { players }: GameState) => {
  for (let i = 0; i < players.length; i++) {
    const { topLeft, bottomRight } = players[i].bar;

    ctx.fillStyle = pongWhite;
    ctx.fillRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    );
  }
};

const drawBall = (
  ctx: CanvasRenderingContext2D,
  {
    ball: {
      position: { x, y },
    },
  }: GameState,
  radius: number
) => {
  const r = radius;

  ctx.fillStyle = pongWhite;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

const redrawGame = (
  canvas: HTMLCanvasElement,
  game: GameState,
  setting: GameSettings
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  clearCanvas(ctx, canvas.width, canvas.height);
  drawBackground(ctx, canvas.width, canvas.height);
  drawScore(ctx, canvas.width, canvas.height, game);
  drawBar(ctx, game);
  drawBall(ctx, game, setting.ball.radius);
};

const drawResult = (
  canvas: HTMLCanvasElement,
  game: GameState,
  result: GameResult,
  names: string[]
) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  if (!ctx) return;
  clearCanvas(ctx, width, height);
  drawBackground(ctx, width, height);
  drawBar(ctx, game);

  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, width, height);

  //Score
  ctx.fillStyle = pongWhite;
  const y = height * 0.45;
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];
    const x = player.side === 'left' ? width / 2 - 400 : width / 2 + 400;
    const resultText = player.id === result.winner.id ? 'WIN' : 'LOSE';

    ctx.font = '160px PixelMplus';
    drawCenteringText(ctx, player.score.toString(), x, y);
    ctx.font = '80px PixelMplus';
    drawCenteringText(ctx, names[i], x, y + 120, 650);
    ctx.font = '70px PixelMplus';
    drawCenteringText(ctx, resultText, x, y + 220);
  }

  ctx.fillStyle = pongWhite;
  ctx.font = '60px PixelMplus';
  drawCenteringText(ctx, 'クリックでタイトルへ', width / 2, 800);
};

export const usePongGame = (isFinished: boolean) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSize = useCanvasSize();
  const navigate = useNavigate();

  const onClickResult = useCallback(() => {
    if (isFinished === false) return;
    navigate('/');
  }, [isFinished, navigate]);

  const renderGame = () => (
    <canvas
      id="pong"
      ref={canvasRef}
      width={staticGameSettings.field.width}
      height={staticGameSettings.field.height}
      //tailwindは動的にスタイル生成できないので、style属性で対応
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
      }}
      onClick={onClickResult}
    />
  );

  const drawGameOneFrame = (game: GameState) => {
    if (canvasRef.current) {
      redrawGame(canvasRef.current, game, staticGameSettings);
    }
  };
  const drawGameResult = (
    game: GameState,
    result: GameResult,
    names: string[]
  ) => {
    if (canvasRef.current) {
      drawResult(canvasRef.current, game, result, names);
    }
  };

  return { renderGame, drawGameOneFrame, drawGameResult };
};
