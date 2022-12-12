import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import { Modal } from '@/components/Modal';

import { CommandCard } from './CommandCard';
import { PongRanking } from './PongRanking';

export const PongTopPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;
  const [isWaiting, setIsWaiting] = useState(false);
  const navigate = useNavigate();

  const cancelWaiting = () => {
    mySocket.emit('pong.match_making.leave');
    setIsWaiting(false);
  };

  const startMatchMaking = (matchType: string) => {
    if (isWaiting) {
      return;
    }
    mySocket.emit('pong.match_making.entry', { matchType: matchType });
  };

  const createPrivateMatch = () => {
    if (isWaiting) {
      return;
    }
    mySocket.emit('pong.private_match.create');
  };

  return (
    <>
      <Modal isOpen={isWaiting} closeModal={cancelWaiting}>
        <div className="flex flex-col gap-5 rounded-md bg-primary p-10">
          <div className="text-3xl">マッチング待機中</div>
          <button
            className="h-[50] w-[100] rounded-sm bg-secondary"
            onClick={cancelWaiting}
          >
            キャンセル
          </button>
        </div>
      </Modal>
      <div className="grid grid-cols-pongTopPage items-center justify-center gap-20 overflow-scroll px-20 py-12">
        <div className="flex shrink-0 flex-col gap-10">
          <CommandCard
            text="カジュアルマッチをプレイ"
            onClick={() => {
              setIsWaiting(true);
              startMatchMaking('CASUAL');
            }}
          />
          <CommandCard
            text="ランクマッチをプレイ"
            onClick={() => {
              setIsWaiting(true);
              startMatchMaking('RANK');
            }}
          />
          <CommandCard
            text="プライベートマッチを作成(デバッグ用)"
            onClick={() => {
              // TODO: このCommandCardはプライベートマッチのデバッグ用なので後で消す
              setIsWaiting(true);
              createPrivateMatch();
            }}
          />
          <CommandCard
            text="プライベートマッチに参加(デバッグ用)"
            onClick={() => {
              // TODO: このCommandCardはプライベートマッチのデバッグ用なので後で消す
              setIsWaiting(true);
              joinPrivateMatch();
            }}
          />
          <CommandCard
            text="もどる"
            onClick={() => {
              navigate('/');
            }}
          />
        </div>
        <PongRanking />
      </div>
    </>
  );
};
