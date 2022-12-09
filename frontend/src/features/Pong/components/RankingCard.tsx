import ordinal from 'ordinal';

import { UserAvatar } from '@/components/UserAvater';

import { UserForRanking } from '../types';

export const RankingCard = ({
  user: { rankPoint, user },
  rankPlace,
}: {
  user: UserForRanking;
  rankPlace: number;
}) => {
  return (
    <li className="flex items-center gap-5 bg-secondary py-2 px-3">
      <div className="w-16 shrink-0 text-4xl font-bold">
        {ordinal(rankPlace)}
      </div>
      <UserAvatar className="h-16 w-16 shrink-0" user={user} />
      <div className="flex grow justify-between gap-5 overflow-hidden">
        <div className="truncate text-3xl">{user.displayName}</div>
        <div className="text-xl">{rankPoint}RP</div>
      </div>
    </li>
  );
};
