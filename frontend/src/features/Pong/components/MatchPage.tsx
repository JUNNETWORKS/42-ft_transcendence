import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

import { useAPICallerWithCredential } from '@/hooks/useAPICaller';

import { usePongGame } from '../hooks/usePongGame';
import { GameState } from '../types';
import { GameResult } from '../types';

export const PongMatchPage: React.FC<{ mySocket: ReturnType<typeof io> }> = (
  props
) => {
  const { mySocket } = props;
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const location = useLocation();
  const fetcher = useAPICallerWithCredential();

  const { renderGame, drawGameOneFrame, drawGameResult } =
    usePongGame(isFinished);

  useEffect(() => {
    // join webSocketRoom by matchId
    fetcher('GET', location.pathname).then((response) => {
      if (!response.ok) {
        // set error
        console.log(response.status);
      } else {
        console.log('success join');
      }
    });

    // Register websocket event handlers
    mySocket.on('pong.match.state', (gameState: GameState) => {
      drawGameOneFrame(gameState);
    });

    mySocket.on(
      'pong.match.finish',
      ({ game, result }: { game: GameState; result: GameResult }) => {
        drawGameResult(game, result);
        setIsFinished(true);
      }
    );

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      mySocket.emit('pong.match.action', {
        up: e.key === 'w' || e.key === 'ArrowUp',
        down: e.key === 's' || e.key === 'ArrowDown',
      });
    };

    const handleKeyUp = () => {
      mySocket.emit('pong.match.action', {
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
  }, [drawGameOneFrame, drawGameResult, mySocket]);

  return (
    <div className="flex flex-1 items-center justify-center">
      {renderGame()}
    </div>
  );
};
