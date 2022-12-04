import ordinal from 'ordinal';

type Props = {
  id: number;
};

export const RankingCard = ({ id }: Props) => {
  //TODO ユーザー取得処理をいれる。
  const name = 'Kizaru';
  const image = '/Kizaru.png';
  const point = 1000;
  return (
    <li className="flex items-center gap-5 bg-secondary py-2 px-3">
      <div className="w-16 text-4xl font-bold">{ordinal(id)}</div>
      <img className="h-16 w-16" src={image}></img>
      <div className="grow text-3xl">{name}</div>
      <div className="text-xl">{point}RP</div>
    </li>
  );
};
