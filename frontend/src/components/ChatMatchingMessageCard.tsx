import { useAtom } from 'jotai';

import { makeCommand } from '@/features/Chat/command';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { chatSocketAtom } from '@/stores/auth';
import { useUserCard } from '@/stores/control';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';

import { AdminOperationBar } from './ChatMemberCard';
import { ChatMessageProp } from './ChatMessageCard';
import { FTButton } from './FTBasicComponents';
import { PopoverUserCard } from './PopoverUserCard';
import { UserAvatar } from './UserAvater';

type PlayerProp = {
  user?: TD.User;
  popoverContent: JSX.Element;
};

const PlayerCard = ({ user, popoverContent }: PlayerProp) => {
  const oc = useUserCard();
  const openCard = () => {
    if (!user) {
      return;
    }
    oc(user, popoverContent);
  };
  const AvatarContent = () => {
    if (!user) {
      return <UserAvatar user={user} />;
    }
    const avatarButton = <UserAvatar user={user} onClick={openCard} />;
    return (
      <PopoverUserCard button={avatarButton}>{popoverContent}</PopoverUserCard>
    );
  };
  const nameContent = (() => {
    if (!user) {
      return <>対戦相手を募集中</>;
    }
    return <PopoverUserCard user={user}>{popoverContent}</PopoverUserCard>;
  })();
  return (
    <div className="flex w-[120px] shrink-0 grow-0 flex-col items-center overflow-hidden">
      <AvatarContent />
      <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-xl">
        {nameContent}
      </div>
    </div>
  );
};

type SubPayload = {
  status: 'PR_OPEN' | 'PR_CANCEL' | 'PR_START' | 'PR_RESULT' | 'PR_ERROR';
  userScore?: number;
  secondaryUserScore?: number;
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
  const command = makeCommand(mySocket, props.room.id);
  const { status } = props.message.subpayload as SubPayload;
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  return (
    <div
      className="m-2 flex flex-row items-start overflow-hidden border-2 border-solid px-2 py-1 text-sm hover:bg-gray-800"
      key={props.message.id}
      id={props.id}
    >
      <div className="flex w-full flex-col items-center">
        <div>
          <span className="text-2xl font-bold">Private Match[{status}]</span>
          {status === 'PR_OPEN' && (
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
          />
          <div className="shrink-0 grow-0">
            <p className="p-1 text-5xl">VS</p>
          </div>
          <div className="shrink-0 grow-0">
            <PlayerCard
              user={targetUser}
              popoverContent={
                <AdminOperationBar
                  {...props}
                  member={props.members[targetUser.id]}
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
