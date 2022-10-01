import React, { useEffect, useRef, useState } from 'react';
import { Player, GameState, GameSettings } from '../types';
import { io, Socket } from 'socket.io-client';

// ========================================
// Canvas

const resizeCanvas = (canvas: HTMLCanvasElement, game: GameSettings) => {
  // TODO: 現在の画面サイズとゲーム設定をもとにアスペクト比を保った最も大きいCanvasにする
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const ratio = window.innerWidth;
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
  height: number,
  game: GameState
) => {
  // 背景
  ctx.beginPath();
  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, width, height);
  ctx.closePath();

  // スコア
  ctx.beginPath();
  ctx.font = 'bold 48px serif';
  ctx.fillStyle = '#000';
  const y = height * 0.2;
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];
    let x = 0;
    if (player.side == 'left') {
      x = width * 0.4;
    } else {
      x = width * 0.6;
    }
    ctx.fillText(player.score.toString(), x, y);
  }
  ctx.closePath();
  return;
};

const drawBar = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  game: GameState
) => {
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];

    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.fillRect(
      player.bar.topLeft.x,
      player.bar.topLeft.y,
      player.bar.bottomRight.x - player.bar.topLeft.x,
      player.bar.bottomRight.y - player.bar.topLeft.y
    );
    ctx.closePath();
    player.bar.topLeft;
    player.bar.bottomRight;
  }
};

const drawBall = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  game: GameState
) => {
  const x = game.ball.position.x;
  const y = game.ball.position.y;

  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
};

const redrawGame = (
  canvas: HTMLCanvasElement,
  gameSettings: GameSettings,
  game: GameState
) => {
  resizeCanvas(canvas, gameSettings);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  clearCanvas(ctx, canvas.width, canvas.height);
  drawBackground(ctx, canvas.width, canvas.height, game);
  drawBar(ctx, canvas.width, canvas.height, game);
  drawBall(ctx, canvas.width, canvas.height, game);
};

// ========================================
// React

export const Pong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket>();

  const gameSettings: GameSettings = {
    field: { width: 1920, height: 1080 },
    ball: { radius: 2 * Math.PI, dx: 10, dy: 10 },
  };

  useEffect(() => {
    // WebSocket initialization
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000');
    }
    // Register websocket event handlers
    socketRef.current.on('pong.match.state', (gameState: GameState) => {
      if (canvasRef.current) {
        redrawGame(canvasRef.current, gameSettings, gameState);
      }
    });

    // add event listeners
    window.addEventListener('keydown', (e) => {
      socketRef.current?.emit('pong.match.action', {
        up: e.key === 'w' || e.key === 'ArrowUp',
        down: e.key === 's' || e.key === 'ArrowDown',
      });
    });
    window.addEventListener('keyup', (e) => {
      socketRef.current?.emit('pong.match.action', {
        up: false,
        down: false,
      });
    });
    window.addEventListener('resize', (e) => {
      if (canvasRef.current) {
        resizeCanvas(canvasRef.current, gameSettings);
      }
    });
  }, []);

  return (
    <canvas
      id="pong"
      ref={canvasRef}
      width={gameSettings.field.width}
      height={gameSettings.field.height}
    />
  );
};
