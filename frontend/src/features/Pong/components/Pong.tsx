import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameResult } from '../types';
import { io, Socket } from 'socket.io-client';
import { usePongGame } from '../hooks/usePongGame';

export const Pong: React.FC = () => {
  const socketRef = useRef<Socket>();
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const { renderGame, drawGameOneFrame, drawGameResult } =
    usePongGame(isFinished);

  useEffect(() => {
    // WebSocket initialization
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000/pong');
    }
    // Register websocket event handlers

    socketRef.current.on('pong.match.state', (game: GameState) => {
      drawGameOneFrame(game);
    });

    socketRef.current.on(
      'pong.match.finish',
      ({ game, result }: { game: GameState; result: GameResult }) => {
        drawGameResult(game, result);
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
  }, [drawGameOneFrame, drawGameResult]);

  return (
    <div className="flex flex-1 items-center justify-center">
      {renderGame()}
    </div>
  );
};
