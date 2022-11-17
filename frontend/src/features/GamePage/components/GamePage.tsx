import { Modal } from '@/components/Modal';
import { useState } from 'react';
import { CommandCard } from './CommandCard';
import { RankingCard } from './RankingCard';

export const GamePage = () => {
  const [isWaiting, setIsWaiting] = useState(false);

  const cancelWaiting = () => {
    setIsWaiting(false);
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
      <div className="mx-20 flex flex-1 items-center justify-center gap-20">
        <div className="flex shrink-0 grow-[2] flex-col gap-8">
          <CommandCard
            text="カジュアルマッチをプレイ"
            onClick={() => {
              setIsWaiting(true);
              console.log('start matching casual');
            }}
          />
          <CommandCard
            text="ランクマッチをプレイ"
            onClick={() => {
              setIsWaiting(true);
              console.log('start matching rank');
            }}
          />
          <CommandCard
            text="もどる"
            onClick={() => {
              console.log('backPage');
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
