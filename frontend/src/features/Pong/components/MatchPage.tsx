import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

import { FTButton } from '@/components/FTBasicComponents';
import { makeCommand } from '@/features/Chat/command';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';

import { usePongGame } from '../hooks/usePongGame';
import { GameState } from '../types';
import { GameResult } from '../types';

export const PongMatchPage: React.FC<{ mySocket: ReturnType<typeof io> }> = (
  props
) => {
  const { mySocket } = props;
  const { matchId } = useParams();
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fetcher = useAPICallerWithCredential();

  const { renderGame, drawGameOneFrame, drawGameResult } =
    usePongGame(isFinished);

  useEffect(() => {
    if (error !== '') return;

    const fetchUserName = async (id: string) => {
      try {
        const result = await fetcher('GET', `/users/${id}`);
        if (!result.ok) {
          throw new Error();
        }
        const json = await result.json();
        return json.displayName;
      } catch (error) {
        return 'Error';
      }
    };

    const handleFinished = async ({
      game,
      result,
    }: {
      game: GameState;
      result: GameResult;
    }) => {
      const callApiPromises = game.players.map((item) =>
        fetchUserName(item.id)
      );

      const playerNames = await Promise.all(callApiPromises);
      drawGameResult(game, result, playerNames);
      setIsFinished(true);
    };

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

    // Register websocket event handlers
    mySocket.on('pong.match.state', drawGameOneFrame);
    mySocket.on('pong.match.finish', handleFinished);

    // add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      mySocket.off('pong.match.state', drawGameOneFrame);
      mySocket.off('pong.match.finish', handleFinished);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [drawGameOneFrame, drawGameResult, mySocket, error, fetcher]);

  useEffect(() => {
    if (!mySocket) {
      return;
    }
    const command = makeCommand(mySocket, -1);
    if (matchId) {
      command.pong_spectate_match(matchId, (response: any) => {
        if (response.status !== 'success') {
          switch (response.status) {
            case 'ongoing match is not found':
              setError('進行中でないマッチです。');
              break;
            default:
              setError('エラーが発生しました。');
              break;
          }
        }
      });
    }
  }, [mySocket, matchId]);

  return (
    <div className="flex flex-1 items-center justify-center">
      {!isFinished && error !== '' ? (
        <div className="flex-col">
          <div className="text-red-400">{error}</div>
          <div className="m-1 text-center">
            <FTButton onClick={() => navigate(-1)}>戻る</FTButton>
          </div>
        </div>
      ) : (
        renderGame()
      )}
    </div>
  );
};
