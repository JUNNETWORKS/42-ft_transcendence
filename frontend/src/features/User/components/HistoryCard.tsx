import dayjs from 'dayjs';

import { UserAvatar } from '@/components/UserAvater';
import { User } from '@/typedef';

import { MatchResult } from '../types/MatchResult';

type Props = {
  matchResult: MatchResult;
  opponent: User;
  user: User;
};

export const HistoryCard = ({ matchResult, opponent, user }: Props) => {
  const isWinner =
    matchResult.userScore1 > matchResult.userScore2 &&
    matchResult.userID1 === user.id;
  return (
    <li className="flex items-center">
      <UserAvatar user={opponent} />
      <div className="overflow-hidden">
        <div className="mx-2 truncate text-lg">VS: {opponent.displayName}</div>
        <div className="flex">
          <div className="mx-2 w-16 text-center	">{`${matchResult.userScore1} - ${matchResult.userScore2}`}</div>
          <div className="mx-2 w-16 text-center">
            {isWinner ? 'WIN' : 'LOSE'}
          </div>
          <div className="mx-2 w-16 text-center">{matchResult.matchType}</div>
          <div className="mx-2 w-32 text-center">
            {dayjs(matchResult.endAt).format('YYYY-MM-DD')}
          </div>
        </div>
      </div>
    </li>
  );
};
