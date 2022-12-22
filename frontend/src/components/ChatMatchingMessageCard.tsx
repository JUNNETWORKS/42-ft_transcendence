import { useAtom } from 'jotai';

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

type ApplyProp = {
  matchId: string;
};

const ApplyCard = ({ matchId }: ApplyProp) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [confirm] = useConfirmModal();
  if (!mySocket) {
    return null;
  }
  const command = makeCommand(mySocket, -1);
  return (
    <FTButton
      onClick={async () => {
        console.log('CLICK');
        if (await confirm('このプライベートマッチに参加しますか？')) {
          command.pong_private_match_join(matchId);
        }
      }}
    >
      対戦する
    </FTButton>
  );
};

type PlayerProp = {
  user?: TD.User;
  popoverContent: JSX.Element;
  userScore?: number;
  side: 'left' | 'right';
  verdict: 'won' | 'lose' | null;
};

const PlayerCard = ({
  user,
  popoverContent,
  userScore,
  side,
  verdict,
}: PlayerProp) => {
  const oc = useUserCard();
  const openCard = () => {
    if (!user) {
      return;
    }
    oc(user, popoverContent);
  };
  const { avatar, name } = (() => {
    if (!user) {
      return {
        avatar: <UserAvatar user={user} />,
        name: <>対戦相手募集中</>,
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
  const color =
    verdict === 'won'
      ? 'text-red-400'
      : verdict === 'lose'
      ? 'text-blue-400'
      : '';
  const flexOrder = side === 'left' ? 'flex-row' : 'flex-row-reverse';
  const align = side === 'left' ? 'flex-row' : 'flex-row-reverse';
  const score = isfinite(userScore) ? (
    <div className={`flex ${align} items-center px-1 text-2xl ${color}`}>
      {userScore}
      {verdict === 'won' && (
        <InlineIcon className="px-1 text-base" i={<Icons.Pong.Won />} />
      )}
    </div>
  ) : (
    <></>
  );
  return (
    <div className={`flex w-[180px] shrink-0 grow-0 ${flexOrder}`}>
      {avatar}
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

type SubPayload = {
  status: 'PR_OPEN' | 'PR_CANCEL' | 'PR_START' | 'PR_RESULT' | 'PR_ERROR';
  userScore1?: number;
  userScore2?: number;
};

/**
 * システムメッセージを表示するコンポーネント
 */
export const ChatMatchingMessageCard = (props: ChatMessageProp) => {
  const messageType = props.message.messageType;
  const user = useUserDataReadOnly(props.userId);
  const targetUser = useUserDataReadOnly(props.message.secondaryUserId || -1);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const [, confirmModal] = useConfirmModal();
  const [mySocket] = useAtom(chatSocketAtom);
  const matchId = props.message.matchId;
  if (
    !mySocket ||
    !matchId ||
    messageType !== 'PR_STATUS' ||
    !props.message.subpayload
  ) {
    return null;
  }
  const subpayload = props.message.subpayload;
  const command = makeCommand(mySocket, props.room.id);
  const { status, userScore1, userScore2 } = subpayload as SubPayload;
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  const isYours = props.you?.userId === user.id;
  const isCancelable = isYours && status === 'PR_OPEN';
  const isAppliable = !isYours && status === 'PR_OPEN';
  const verdict1 =
    isfinite(userScore1) && isfinite(userScore2)
      ? userScore1 > userScore2
        ? 'won'
        : 'lose'
      : null;
  const verdict2 = verdict1 ? (verdict1 === 'won' ? 'lose' : 'won') : null;
  const opponentContent = (() => {
    if (isAppliable) {
      return <ApplyCard matchId={matchId} />;
    }
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
      />
    );
  })();
  return (
    <div
      className="m-2 flex flex-row items-start overflow-hidden border-2 border-solid px-2 py-1 text-sm hover:bg-gray-800"
      key={props.message.id}
      id={props.id}
    >
      <div className="flex w-full flex-col items-center">
        <div>
          {isCancelable && (
            <FTButton
              onClick={async () => {
                if (
                  await confirmModal(
                    'プライベートマッチの募集をキャンセルしますか？',
                    {
                      affirm: 'キャンセルする',
                      denial: 'しない',
                    }
                  )
                ) {
                  command.pong_private_match_cancel(matchId);
                }
              }}
            >
              キャンセル
            </FTButton>
          )}
        </div>
        <div className="flex flex-row items-center justify-center">
          <PlayerCard
            user={user}
            popoverContent={<AdminOperationBar {...props} />}
            userScore={userScore1}
            side="left"
            verdict={verdict1}
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
