import React, { Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

import { FTButton } from '@/components/FTBasicComponents';
import { makeCommand } from '@/features/Chat/command';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';

import { usePongGame } from '../hooks/usePongGame';
import { GameState } from '../types';
import { GameResult } from '../types';

const MatchRoomJoiner = ({
  isFetched,
  setIsFetched,
  setError,
}: {
  isFetched: boolean;
  setIsFetched: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const location = useLocation();
  const fetcher = useAPICallerWithCredential();

  if (!isFetched)
    throw fetcher('GET', location.pathname).then((response) => {
      if (!response.ok) {
        console.log(response.status);
        switch (response.status) {
          case 404:
            setError('存在しないマッチです。');
            break;
          case 400:
            setError('進行中でないマッチです。');
            break;
          default:
            setError('エラーが発生しました。');
            break;
        }
      } else {
        console.log('success join');
      }
      setIsFetched(true);
    });

  return <></>;
};

export const PongMatchPage: React.FC<{ mySocket: ReturnType<typeof io> }> = (
  props
) => {
  const { mySocket } = props;
  const { matchId } = useParams();
  const [isFetched, setIsFetched] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fetcher = useAPICallerWithCredential();

  const { renderGame, drawGameOneFrame, drawGameResult } =
    usePongGame(isFinished);

  useEffect(() => {
    if (!isFetched && error !== '') return;

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

    const command = makeCommand(mySocket, -1);
    if (matchId) {
      command.pong_spectate_match(matchId);
    }

    return () => {
      mySocket.off('pong.match.state', drawGameOneFrame);
      mySocket.off('pong.match.finish', handleFinished);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isFetched, drawGameOneFrame, drawGameResult, mySocket, error, fetcher]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Suspense fallback={<p>Loading...</p>}>
        <MatchRoomJoiner
          isFetched={isFetched}
          setIsFetched={setIsFetched}
          setError={setError}
        />
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
      </Suspense>
    </div>
  );
};
