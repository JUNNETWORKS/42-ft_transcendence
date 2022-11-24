import { UserCard } from '@/features/User/UserCard';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import { Popover } from '@headlessui/react';
import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { usePopper } from 'react-popper';
import { AdminOperationBar } from './ChatMemberCard';
import { UserAvatar } from './UserAvater';

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
  const user = useUserDataReadOnly(props.member.userId);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
  });
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  return (
    <Popover className="relative">
      <div
        className="flex flex-row items-start px-2 py-1"
        key={props.message.id}
      >
        <div className="shrink-0 grow-0">
          <Popover.Button>
            <UserAvatar
              className="h-12 w-12 border-4 border-solid border-gray-600"
              user={user}
            />
          </Popover.Button>
        </div>
        <div className="flex shrink grow flex-col">
          <div className="flex max-w-[12em] shrink-0 grow-0 flex-row">
            <div className="m-[1px] shrink-0 grow-0 px-[2px] py-0">
              <Popover.Button
                className="max-w-[20em] overflow-hidden text-ellipsis px-1 font-bold hover:underline"
                ref={setReferenceElement}
              >
                {user.displayName}
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
