import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

import { Modal } from '@/components/Modal';

import { CommandCard } from './CommandCard';
import { PongRanking } from './PongRanking';

export const PongTopPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;
  const [isWaiting, setIsWaiting] = useState(false);
  const navigate = useNavigate();

  // 参加中のマッチがあればそこに飛ばす
  useEffect(() => {
    if (mySocket) {
      mySocket.emit(
        'pong.match.participation_status',
        {},
        (data: { matchId?: string }) => {
          console.log(
            `CLIENT RECEIVE: pong.match.participation_status: ${JSON.stringify(
              data
            )}`
          );
          const matchId = data.matchId;
          if (matchId) {
            navigate(`/pong/matches/${matchId}`);
          }
        }
      );
    }
  }, [mySocket]);

  const cancelWaiting = () => {
    mySocket.emit('pong.match_making.leave');
    setIsWaiting(false);
  };

  const startMatchMaking = (matchType: string) => {
    if (isWaiting) {
      return;
    }
    mySocket.emit(
      'pong.match_making.entry',
      { matchType: matchType },
      (result: any) => {
        if (result && result.status === 'accepted') {
          setIsWaiting(true);
          return;
        }
        toast('マッチに参加できません');
      }
    );
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
            text="参加中のマッチに復帰"
            onClick={() => {
              mySocket.emit(
                'pong.match.participation_status',
                {},
                (data: { matchId?: string }) => {
                  console.log(
                    `CLIENT RECEIVE: pong.match.participation_status: ${JSON.stringify(
                      data
                    )}`
                  );
                  const matchId = data.matchId;
                  if (matchId) {
                    navigate(`/pong/matches/${matchId}`);
                  }
                }
              );
            }}
          />
          <CommandCard
            text="カジュアルマッチをプレイ"
            onClick={() => {
              startMatchMaking('CASUAL');
            }}
          />
          <CommandCard
            text="ランクマッチをプレイ"
            onClick={() => {
              startMatchMaking('RANK');
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
