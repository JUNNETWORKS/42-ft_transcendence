import { UserCard } from '@/features/User/UserCard';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import { Popover } from '@headlessui/react';
import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { usePopper } from 'react-popper';
import { AdminOperationBar } from './ChatMemberCard';

/**
 * メッセージを表示するコンポーネント
 */
export const ChatMessageCard = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  message: TD.ChatRoomMessage;
  member: TD.ChatUserRelation;
  memberOperations: TD.MemberOperations;
}) => {
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
  });
  if (blockingUsers && blockingUsers.find((u) => u.id === props.message.userId))
    return null;
  return (
    <div
      className="flex flex-col border-[1px] border-solid border-white p-2"
      key={props.message.id}
    >
      <div className="flex flex-row">
        <div className="m-[1px] px-[2px] py-0">
          <Popover className="relative">
            <Popover.Button
              className="bg-white px-1 text-black"
              ref={setReferenceElement}
            >
              {props.message.user.displayName}
            </Popover.Button>

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
          </Popover>
        </div>
        <div className="pr-[4px]">
          {dayjs(props.message.createdAt).format('MM/DD HH:mm:ss')}
        </div>
        <div className="pr-[4px]">chatRoomId: {props.message.chatRoomId}</div>
      </div>
      <div>{props.message.content}</div>
    </div>
  );
};
