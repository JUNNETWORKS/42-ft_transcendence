import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';

import { useUserCard } from '@/stores/control';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';

import { AdminOperationBar } from './ChatMemberCard';
import { PopoverUserCard } from './PopoverUserCard';
import { UserAvatar } from './UserAvater';

export type ChatMessageProp = {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  message: TD.ChatRoomMessage;
  userId: number;
  member?: TD.ChatUserRelation;
  members: TD.UserRelationMap;
  id: string;
};

export type ChatMessageCardComponent = (props: ChatMessageProp) => JSX.Element;

/**
 * メッセージを表示するコンポーネント
 */
export const ChatMessageCard = (props: ChatMessageProp) => {
  const user = useUserDataReadOnly(props.userId);
  const openCard = useUserCard();
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  const popoverContent = () => (
    <AdminOperationBar room={props.room} userId={props.member?.userId} />
  );
  const avatarButton = (
    <UserAvatar
      className="h-12 w-12 border-4 border-solid border-gray-600"
      user={user}
      onClick={() => openCard(user, popoverContent)}
    />
  );
  return (
    <div
      className="flex flex-row items-start px-2 py-1 hover:bg-gray-800"
      key={props.message.id}
      id={props.id}
    >
      <div className="shrink-0 grow-0">
        <PopoverUserCard button={avatarButton} inner={popoverContent} />
      </div>
      <div className="flex shrink grow flex-col">
        <div className="flex max-w-[12em] shrink-0 grow-0 flex-row">
          <div className="m-[1px] shrink-0 grow-0 px-[2px] py-0">
            <PopoverUserCard user={user} inner={popoverContent} />
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
  );
};
