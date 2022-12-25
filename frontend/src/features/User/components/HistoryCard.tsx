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

const OutcomeLabel = ({ verdict }: { verdict: 'WIN' | 'LOSE' | null }) => {
  const color = (() => {
    switch (verdict) {
      case 'WIN':
        return 'text-red-400';
      case 'LOSE':
        return 'text-blue-400';
      default:
        return '';
    }
  })();
  return <div className={color}>{verdict || ''}</div>;
};

type Props = {
  matchResult: MatchResult;
  opponent: User;
};

export const HistoryCard = ({ matchResult, opponent }: Props) => {
  const openCard = useUserCard();
  const avatarButton = (
    <UserAvatar user={opponent} onClick={() => openCard(opponent)} />
  );
  const user1IsOpponent = matchResult.userId1 === opponent.id;
  const yourScore = user1IsOpponent
    ? matchResult.userScore2
    : matchResult.userScore1;
  const opponentScore = user1IsOpponent
    ? matchResult.userScore1
    : matchResult.userScore2;
  const finished = matchResult.matchStatus === 'DONE';
  const verdict =
    finished && yourScore > opponentScore
      ? 'WIN'
      : finished && yourScore < opponentScore
      ? 'LOSE'
      : null;
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
          <div className="mx-2 shrink-0 grow-0 basis-16 text-center">
            {yourScore} - {opponentScore}
          </div>
          <div className="shrink-0 grow-0 basis-16 text-center">
            <OutcomeLabel verdict={verdict} />
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
