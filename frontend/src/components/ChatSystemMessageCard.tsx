import { UserCard } from '@/features/User/UserCard';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import { compact } from '@/utils';
import { Popover } from '@headlessui/react';
import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { usePopper } from 'react-popper';
import { AdminOperationBar } from './ChatMemberCard';

/**
 * システムメッセージを表示するコンポーネント
 */
export const ChatSystemMessageCard = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  message: TD.ChatRoomMessage;
  userId: number;
  member?: TD.ChatUserRelation;
  memberOperations: TD.MemberOperations;
  id: string;
}) => {
  const messageType = props.message.messageType;
  const user = useUserDataReadOnly(props.userId);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
  });
  if (!messageType) {
    return null;
  }
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  const nameButton = (
    <Popover.Button
      className="max-w-[20em] overflow-hidden text-ellipsis px-1 font-bold hover:underline"
      ref={setReferenceElement}
    >
      {user.displayName}
    </Popover.Button>
  );
  const content = () => {
    switch (messageType) {
      case 'OPENED':
        return <>{nameButton} さんがルームを作成しました -</>;
      case 'UPDATED': {
        const diff = props.message.subpayload || {};
        const nameDiff = diff.roomName ? `ルーム名 → ${diff.roomName}` : null;
        const typeDiff = diff.roomType ? `種別 → ${diff.roomType}` : null;
        const diffText = compact([nameDiff, typeDiff]);
        if (!diffText) {
          return null;
        }
        return (
          <>
            {nameButton} さんがルームを更新しました: {diffText.join(', ')} -
          </>
        );
      }
      case 'JOINED':
        return <>{nameButton} さんが入室しました -</>;
      case 'LEFT':
        return <>{nameButton} さんが退出しました -</>;
      default:
        return <span>not implemented</span>;
    }
  };
  return (
    <Popover className="relative">
      <div
        className="flex flex-row items-start px-2 py-1"
        key={props.message.id}
        id={props.id}
      >
        <div className="flex shrink grow flex-col">
          <div className="flex max-w-[12em] shrink-0 grow-0 flex-row">
            <div className="m-[1px] shrink-0 grow-0 px-[2px] py-0">
              {content()}
              <Popover.Panel
                className="absolute z-10 border-8 border-gray-500 bg-black/90"
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <UserCard id={props.message.userId}>
                  <AdminOperationBar {...props} />
                </UserCard>
              </Popover.Panel>
            </div>
            <div className="shrink-0 grow-0 px-[4px]">
              {dayjs(props.message.createdAt).format('MM/DD HH:mm:ss')}
            </div>
          </div>
        </div>
      </div>
    </Popover>
  );
};
