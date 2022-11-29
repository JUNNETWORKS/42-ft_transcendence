import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';

type Props = {
  message: TD.ChatRoomMessage;
  id: string;
};

/**
 * メッセージを表示するコンポーネント
 */
export const ChatMessageCard = ({ message, id }: Props) => {
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  if (blockingUsers && blockingUsers.find((u) => u.id === message.userId))
    return null;
  return (
    <div
      className="flex flex-col border-[1px] border-solid border-white p-2"
      key={message.id}
      id={id}
    >
      <div className="flex flex-row">
        <div className="m-[1px] bg-white px-[2px] py-0 text-black">
          {message.user.displayName}
        </div>
        <div className="pr-[4px]">
          {dayjs(message.createdAt).format('MM/DD HH:mm:ss')}
        </div>
        <div className="pr-[4px]">chatRoomId: {message.chatRoomId}</div>
      </div>
      <div>{message.content}</div>
    </div>
  );
};
