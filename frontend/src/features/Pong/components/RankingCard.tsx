import ordinal from 'ordinal';

import { UserForRanking } from '../types';

export const RankingCard = ({
  user: { rankPoint, user },
  rankPlace,
}: {
  user: UserForRanking;
  rankPlace: number;
}) => {
  //TODO ユーザー画像取得処理をいれる。
  const image = '/Kizaru.png';
  return (
    <li className="flex items-center gap-5 bg-secondary py-2 px-3">
      <div className="w-16 text-4xl font-bold">{ordinal(rankPlace)}</div>
      <img className="h-16 w-16" src={image}></img>
      <div className="grow text-3xl">{user.displayName}</div>
      <div className="text-xl">{rankPoint}RP</div>
    </li>
  );
};
