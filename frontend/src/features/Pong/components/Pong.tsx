import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Player, GameState, GameResult } from '../types';
import { io, Socket } from 'socket.io-client';
import { Modal } from '@/components/Modal';
import { useWindowMagnification } from '../hooks/useWindowMagnification';

const staticGameSettings = {
  field: { width: 1920, height: 1080 },
  ball: { radius: 6, dx: 2, dy: 2 },
};

const pongBlack = '#000000';
const pongWhite = '#FFFFFE';

// ========================================
// Canvas

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
  // 背景枠
  ctx.beginPath();
  ctx.fillStyle = pongWhite;
  ctx.fillRect(0, 0, width, height);
  ctx.closePath();
  //背景色
  const bezelSize = 5;
  ctx.beginPath();
  ctx.fillStyle = pongBlack;
  ctx.fillRect(
    bezelSize,
    bezelSize,
    width - bezelSize * 2,
    height - bezelSize * 2
  );
  ctx.closePath();

  //中央破線
  const dashedLineHeight = 25;
  const dashedLineWidth = 15;

  for (let startY = 0; startY < height; startY += dashedLineHeight * 2) {
    ctx.beginPath();
    ctx.fillStyle = pongWhite;
    const startX = width / 2 - dashedLineWidth / 2;
    ctx.fillRect(startX, startY, dashedLineWidth, dashedLineHeight);
    ctx.closePath();
  }

  // スコア
  ctx.beginPath();
  ctx.font = '160px PixelMplus';
  ctx.fillStyle = pongWhite;
  const y = height * 0.25;
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];
    let x = 0;
    if (player.side == 'left') {
      //中央から150px離した位置。左はフォントの大きさ分ずらす。
      x = width / 2 - 150 - 160;
    } else {
      x = width / 2 + 150;
    }
    ctx.fillText(player.score.toString(), x, y);
  }
  ctx.closePath();
};

const drawBar = (ctx: CanvasRenderingContext2D, { players }: GameState) => {
  for (let i = 0; i < players.length; i++) {
    const { topLeft, bottomRight } = players[i].bar;

    ctx.beginPath();
    ctx.fillStyle = pongWhite;
    ctx.fillRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    );
    ctx.closePath();
  }
};

const drawBall = (
  ctx: CanvasRenderingContext2D,
  {
    ball: {
      position: { x, y },
    },
  }: GameState
) => {
  const r = staticGameSettings.ball.radius;

  ctx.beginPath();
  ctx.fillStyle = pongWhite;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fill();
  ctx.closePath();
};

const redrawGame = (canvas: HTMLCanvasElement, game: GameState) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  clearCanvas(ctx, canvas.width, canvas.height);
  drawBackground(ctx, canvas.width, canvas.height, game);
  drawBar(ctx, game);
  drawBall(ctx, game);
};

// ========================================
// React

const CalculateCanvasSize = (magnification: number) => {
  //TODO ゲーム中はnavBarを消してもいいかも
  const magnifiedHeight = staticGameSettings.field.height * magnification;

  const navBarSize = 80;
  const maxCanvasHeight = window.innerHeight - navBarSize;

  const canContainMagnifiedCanvas = maxCanvasHeight >= magnifiedHeight;

  // navBarを除いた高さに横幅から計算した倍率をかけた高さ or navBarを除いた高さ
  const height = canContainMagnifiedCanvas ? magnifiedHeight : maxCanvasHeight;

  //maxCanvasHeightを採用した場合、16:9の横幅を計算する
  const width = canContainMagnifiedCanvas
    ? staticGameSettings.field.width * magnification
    : maxCanvasHeight * (16 / 9);

  return { width, height };
};

export const Pong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket>();
  const [matchResult, setMatchResult] = useState<GameResult | null>(null);

  const magnification = useWindowMagnification(staticGameSettings.field.width);
  const canvasDisplaySize = useMemo(
    () => CalculateCanvasSize(magnification),
    [magnification]
  );

  useEffect(() => {
    // WebSocket initialization
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000/pong');
    }
    // Register websocket event handlers
    socketRef.current.on('pong.match.state', (gameState: GameState) => {
      if (canvasRef.current) {
        redrawGame(canvasRef.current, gameState);
      }
    });
    socketRef.current.on('pong.match.finish', (gameResult: GameResult) => {
      setMatchResult(gameResult);
    });

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      socketRef.current?.emit('pong.match.action', {
        up: e.key === 'w' || e.key === 'ArrowUp',
        down: e.key === 's' || e.key === 'ArrowDown',
      });
    };

    const handleKeyUp = () => {
      socketRef.current?.emit('pong.match.action', {
        up: false,
        down: false,
      });
    };

    // add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <>
      <Modal
        isOpen={matchResult !== null}
        //TODO タイトルへ戻る処理？
        closeModal={() => {
          console.log('test');
        }}
      >
        <div className="flex items-center justify-center">
          <p className="text-lg">{matchResult?.winner.id} win</p>
        </div>
      </Modal>
      <div className="flex flex-1 items-center justify-center">
        <canvas
          id="pong"
          ref={canvasRef}
          width={staticGameSettings.field.width}
          height={staticGameSettings.field.height}
          //tailwindは動的にスタイル生成できないので、style属性で対応
          style={{
            width: canvasDisplaySize.width,
            height: canvasDisplaySize.height,
          }}
        />
      </div>
    </>
  );
};
