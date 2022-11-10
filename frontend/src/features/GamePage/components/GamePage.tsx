import { CommandCard } from './CommandCard';
import { RankingCard } from './RankingCard';

export const GamePage = () => {
  return (
    <div className="mx-20 flex flex-1 items-center justify-center gap-20">
      <div className="flex shrink-0 grow-[2] flex-col gap-8">
        <CommandCard
          text="カジュアルマッチをプレイ"
          onClick={() => {
            console.log('start matching casual');
          }}
        />
        <CommandCard
          text="ランクマッチをプレイ"
          onClick={() => {
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
  );
};
