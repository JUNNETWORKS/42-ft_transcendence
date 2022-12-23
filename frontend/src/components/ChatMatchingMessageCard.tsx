import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

import { makeCommand } from '@/features/Chat/command';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { Icons } from '@/icons';
import { chatSocketAtom } from '@/stores/auth';
import { useUserCard } from '@/stores/control';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import { isfinite } from '@/utils';

import { AdminOperationBar } from './ChatMemberCard';
import { ChatMessageProp } from './ChatMessageCard';
import { FTButton } from './FTBasicComponents';
import { PopoverUserCard } from './PopoverUserCard';
import { UserAvatar } from './UserAvater';

type ButtonProp = {
  onClick: () => Promise<void>;
  text: string;
};

const CommandButton = ({ onClick, text }: ButtonProp) => (
  <FTButton className="text-base" onClick={onClick}>
    {text}
  </FTButton>
);

type PlayerProp = {
  user?: TD.User;
  popoverContent: JSX.Element;
  userScore?: number;
  side: 'left' | 'right';
  verdict: 'won' | 'lose' | 'none';
  matchId: string;
  isYours: boolean;
};

const PlayerCard = ({
  user,
  popoverContent,
  userScore,
  side,
  verdict,
  matchId,
  isYours,
}: PlayerProp) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [, , confirm, confirmDestructive] = useConfirmModal();
  const oc = useUserCard();
  if (!mySocket) {
    return null;
  }
  const command = makeCommand(mySocket, -1);
  const openCard = () => {
    if (user) {
      oc(user, popoverContent);
    }
  };
  const { avatar, name } = (() => {
    if (!user) {
      const button = isYours ? (
        <CommandButton
          text="キャンセル"
          onClick={confirmDestructive(
            'プライベートマッチの募集をキャンセルしますか？',
            () => command.pong_private_match_cancel(matchId),
            {
              affirm: 'キャンセルする',
              denial: 'しない',
            }
          )}
        />
      ) : (
        <CommandButton
          text="対戦する"
          onClick={confirm('このプライベートマッチに参加しますか？', () =>
            command.pong_private_match_join(matchId)
          )}
        />
      );
      return {
        avatar: <UserAvatar />,
        name: button,
      };
    }
    const avatarButton = <UserAvatar user={user} onClick={openCard} />;
    return {
      avatar: (
        <PopoverUserCard button={avatarButton}>
          {popoverContent}
        </PopoverUserCard>
      ),
      name: <PopoverUserCard user={user}>{popoverContent}</PopoverUserCard>,
    };
  })();
  const color = {
    won: 'text-red-400',
    lose: 'text-blue-400',
    none: '',
  }[verdict];
  const flexOrder = side === 'right' ? 'flex-row' : 'flex-row-reverse';
  const align = side === 'right' ? 'text-left' : 'text-right';
  const score = isfinite(userScore) ? (
    <div
      className={`flex ${flexOrder} ${align} items-center px-1 text-2xl ${color}`}
    >
      {userScore}
      {verdict === 'won' && (
        <InlineIcon className="px-1 text-base" i={<Icons.Pong.Won />} />
      )}
    </div>
  ) : null;
  return (
    <div className={`flex w-[180px] shrink-0 grow-0 ${flexOrder}`}>
      <div className="flex shrink-0 grow-0 items-center justify-center">
        {avatar}
      </div>
      <div className="flex shrink-0 grow-0 flex-col justify-center">
        <div
          className={`w-full overflow-hidden text-ellipsis whitespace-nowrap p-0 ${align} text-xl`}
        >
          {name}
        </div>
        {score}
      </div>
    </div>
  );
};

/**
 * システムメッセージを表示するコンポーネント
 */
export const ChatMatchingMessageCard = (props: ChatMessageProp) => {
  const messageType = props.message.messageType;
  const user = useUserDataReadOnly(props.userId);
  const targetUser = useUserDataReadOnly(props.message.secondaryUserId || -1);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const [, , , confirm] = useConfirmModal();
  const navigate = useNavigate();
  const matchId = props.message.matchId;
  if (!matchId || messageType !== 'PR_STATUS' || !props.message.subpayload) {
    return null;
  }
  const { status, userScore1, userScore2 } = props.message.subpayload as {
    status: 'PR_OPEN' | 'PR_CANCEL' | 'PR_START' | 'PR_RESULT' | 'PR_ERROR';
    userScore1?: number;
    userScore2?: number;
  };
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  const isYours = props.you?.userId === user.id;
  const verdict1 =
    status === 'PR_RESULT' && isfinite(userScore1) && isfinite(userScore2)
      ? userScore1 > userScore2
        ? 'won'
        : 'lose'
      : 'none';
  const verdict2 =
    verdict1 !== 'none' ? (verdict1 === 'won' ? 'lose' : 'won') : 'none';
  const opponentContent = (() => {
    return (
      <PlayerCard
        user={targetUser}
        popoverContent={
          targetUser && (
            <AdminOperationBar
              {...props}
              member={props.members[targetUser.id]}
            />
          )
        }
        userScore={userScore2}
        side="right"
        verdict={verdict2}
        matchId={matchId}
        isYours={isYours}
      />
    );
  })();

  const isSpectatable = status === 'PR_START';
  const spectateClass = isSpectatable ? 'cursor-pointer' : '';
  const onClick = !isSpectatable
    ? undefined
    : confirm('このプライベートマッチを観戦しますか？', () =>
        navigate(`/pong/matches/${matchId}`)
      );
  return (
    <div
      className={`m-2 flex flex-row items-start overflow-hidden px-2 py-1 text-sm ${spectateClass} hover:bg-gray-800`}
      key={props.message.id}
      id={props.id}
      onClick={onClick}
    >
      <div className="flex w-full flex-col items-center">
        <div className="flex flex-row items-center justify-center">
          <PlayerCard
            user={user}
            popoverContent={<AdminOperationBar {...props} />}
            userScore={userScore1}
            side="left"
            verdict={verdict1}
            matchId={matchId}
            isYours={isYours}
          />
          <div className="shrink-0 grow-0">
            <p className="p-2 text-5xl">VS</p>
          </div>
          <div className="shrink-0 grow-0">{opponentContent}</div>
        </div>
      </div>
    </div>
  );
};
