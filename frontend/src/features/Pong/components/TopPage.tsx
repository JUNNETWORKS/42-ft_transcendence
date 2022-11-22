import { Modal } from '@/components/Modal';
import React, { useState, useEffect, useRef } from 'react';
import { CommandCard } from './CommandCard';
import { RankingCard } from './RankingCard';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

export const PongTopPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // マッチメイキング進捗通知
    mySocket.on('pong.match_making.progress', (data) => {
      setWaitingCount(data.waitingPlayerCount);
    });

    // マッチメイキング完了通知
    mySocket.on('pong.match_making.done', (data) => {
      const matchID = data.matchID;
      // 対戦ページに遷移する
      navigate(`/pong/matches/${matchID}`);
    });

    return () => {
      mySocket?.off('pong.match_makind.progress');
      mySocket?.off('pong.match_makind.done');
    };
  }, []);

  const cancelWaiting = () => {
    mySocket?.emit('pong.match_making.leave');
    setIsWaiting(false);
  };

  const StartMatchMaking = (queueID: string) => {
    if (isWaiting) {
      return;
    }
    mySocket?.emit('pong.match_making.entry', { queueID: queueID });
  };

  return (
    <>
      <Modal isOpen={isWaiting} closeModal={cancelWaiting}>
        <div className="flex flex-col gap-5 rounded-md bg-primary p-10">
          <div className="text-3xl">マッチング待機中</div>
          <div className="text-3xl">待機ユーザー: {waitingCount}人</div>
          <button
            className="h-[50] w-[100] rounded-sm bg-secondary"
            onClick={cancelWaiting}
          >
            キャンセル
          </button>
        </div>
      </Modal>
      <div className="mx-20 flex flex-1 items-center justify-center gap-20">
        <div className="flex shrink-0 grow-[2] flex-col gap-8">
          <CommandCard
            text="カジュアルマッチをプレイ"
            onClick={() => {
              setIsWaiting(true);
              StartMatchMaking('CASUAL');
            }}
          />
          <CommandCard
            text="ランクマッチをプレイ"
            onClick={() => {
              setIsWaiting(true);
              StartMatchMaking('RANK');
            }}
          />
          <CommandCard
            text="もどる"
            onClick={() => {
              navigate('/');
            }}
          />
        </div>
        <div className="grow-[1]">
          <p className="text-5xl font-bold leading-tight">Ranking</p>
          <div className=" h-2 w-[360] bg-primary"></div>
          <ul className="mt-2 flex flex-col gap-3">
            <RankingCard id={1} />
            <RankingCard id={2} />
            <RankingCard id={3} />
            <RankingCard id={4} />
            <RankingCard id={5} />
          </ul>
        </div>
      </div>
    </>
  );
};
