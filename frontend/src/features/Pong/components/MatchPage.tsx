import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { usePongGame } from '../hooks/usePongGame';
import { GameState } from '../types';
import { GameResult } from '../types';

export const PongMatchPage: React.FC<{ mySocket: ReturnType<typeof io> }> = (
  props
) => {
  const { mySocket } = props;
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const { renderGame, drawGameOneFrame, drawGameResult } =
    usePongGame(isFinished);

  useEffect(() => {
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

    // add event listeners
    window.addEventListener('keydown', (e) => {
      mySocket.emit('pong.match.action', {
        up: e.key === 'w' || e.key === 'ArrowUp',
        down: e.key === 's' || e.key === 'ArrowDown',
      });
    });
    window.addEventListener('keyup', (e) => {
      mySocket.emit('pong.match.action', {
        up: false,
        down: false,
      });
    });
    // TODO: 必要なら windown の keydown/keyup をremoveすること
  }, [drawGameOneFrame, drawGameResult]);

  return (
    <div className="flex flex-1 items-center justify-center">
      {renderGame()}
    </div>
  );
};
