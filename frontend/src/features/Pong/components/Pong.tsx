import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameResult } from '../types';
import { io, Socket } from 'socket.io-client';
import { useCanvasSize } from '../hooks/useCanvasSize';
import { redrawGame, drawResultCanvas } from '../utils/CanvasUtils';

const staticGameSettings = {
  field: { width: 1920, height: 1080 },
  ball: { radius: 6, dx: 2, dy: 2 },
};

export const Pong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket>();
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const canvasSize = useCanvasSize();

  const onClickCanvas = () => {
    if (isFinished === false) return;
    //TODO タイトルへ遷移
    console.log('to title');
  };

  useEffect(() => {
    // WebSocket initialization
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000/pong');
    }
    // Register websocket event handlers
    socketRef.current.on('pong.match.state', (gameState: GameState) => {
      if (canvasRef.current) {
        redrawGame(canvasRef.current, gameState, staticGameSettings);
      }
    });
    socketRef.current.on(
      'pong.match.finish',
      ({ game, result }: { game: GameState; result: GameResult }) => {
        if (canvasRef.current) {
          drawResultCanvas(canvasRef.current, game, result);
        }
        setIsFinished(true);
      }
    );

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
    <div className="flex flex-1 items-center justify-center">
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
        onClick={onClickCanvas}
      />
    </div>
  );
};
