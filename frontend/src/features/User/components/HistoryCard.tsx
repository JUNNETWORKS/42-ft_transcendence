import dayjs from 'dayjs';

import { PopoverUserCard } from '@/components/PopoverUserCard';
import { UserAvatar } from '@/components/UserAvater';
import { useUserCard } from '@/stores/control';
import { User } from '@/typedef';

import { MatchResult, MatchType } from '../types/MatchResult';

const MatchTypeLabel = ({ matchType }: { matchType: MatchType }) => {
  return (
    <div className="border-[1px] border-solid border-white">{matchType}</div>
  );
};

const OutcomeLabel = ({
  matchResult,
  user,
}: {
  matchResult: MatchResult;
  user: User;
}) => {
  const isWinner =
    matchResult.userScore1 > matchResult.userScore2 &&
    matchResult.userID1 === user.id;
  const r = isWinner
    ? { className: 'text-red-400', text: 'WIN' }
    : { className: 'text-blue-400', text: 'LOSE' };
  return <div className={r.className}>{r.text}</div>;
};

type Props = {
  matchResult: MatchResult;
  opponent: User;
  user: User;
};

export const HistoryCard = ({ matchResult, opponent, user }: Props) => {
  const openCard = useUserCard();
  const avatarButton = (
    <UserAvatar user={opponent} onClick={() => openCard(opponent)} />
  );
  return (
    <li className="flex w-full flex-row items-center">
      <div className="shrink-0 grow-0">
        <PopoverUserCard button={avatarButton} />
      </div>
      <div className="flex shrink grow flex-col overflow-hidden">
        <div className="mx-2 flex min-w-0 shrink-0 grow-0 flex-row text-lg">
          <p>VS:</p>
          <PopoverUserCard user={opponent} />
        </div>
        <div className="flex shrink-0 grow-0">
          <div className="mx-2 shrink-0 grow-0 basis-16 text-center">{`${matchResult.userScore1} - ${matchResult.userScore2}`}</div>
          <div className="shrink-0 grow-0 basis-16 text-center">
            <OutcomeLabel matchResult={matchResult} user={user} />
          </div>
          <div className="shrink-0 grow-0 basis-20 text-center">
            <MatchTypeLabel matchType={matchResult.matchType} />
          </div>
          <div className="mx-2 shrink grow text-center">
            {dayjs(matchResult.endAt).format('YYYY-MM-DD')}
          </div>
        </div>
      </div>
    </li>
  );
};
