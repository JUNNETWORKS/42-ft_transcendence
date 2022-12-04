import { Popover } from '@headlessui/react';
import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';

import { UserCard } from '@/features/User/UserCard';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';

import { AdminOperationBar } from './ChatMemberCard';
import { PopoverUserName } from './PopoverUserName';
import { UserAvatar } from './UserAvater';

/**
 * メッセージを表示するコンポーネント
 */
export const ChatMessageCard = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  message: TD.ChatRoomMessage;
  userId: number;
  member?: TD.ChatUserRelation;
  memberOperations: TD.MemberOperations;
  id: string;
}) => {
  const user = useUserDataReadOnly(props.userId);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  const avatarButton = (
    <Popover.Button>
      <UserAvatar
        className="h-12 w-12 border-4 border-solid border-gray-600"
        user={user}
      />
    </Popover.Button>
  );
  const popoverContent = (
    <UserCard id={props.message.userId}>
      <AdminOperationBar {...props} />
    </UserCard>
  );
  return (
    <Popover className="relative">
      <div
        className="flex flex-row items-start px-2 py-1"
        key={props.message.id}
        id={props.id}
      >
        <div className="shrink-0 grow-0">
          <PopoverUserName button={avatarButton}>
            {popoverContent}
          </PopoverUserName>
        </div>
        <div className="flex shrink grow flex-col">
          <div className="flex max-w-[12em] shrink-0 grow-0 flex-row">
            <div className="m-[1px] shrink-0 grow-0 px-[2px] py-0">
              <PopoverUserName user={user}>{popoverContent}</PopoverUserName>
            </div>
            <div className="shrink-0 grow-0 px-[4px]">
              {dayjs(props.message.createdAt).format('MM/DD HH:mm:ss')}
            </div>
          </div>
          <div className="shrink grow px-2">
            <div>{props.message.content}</div>
          </div>
        </div>
      </div>
    </Popover>
  );
};
