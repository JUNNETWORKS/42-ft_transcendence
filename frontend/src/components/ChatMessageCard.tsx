import * as TD from '@/typedef';
import * as dayjs from 'dayjs';

/**
 * メッセージを表示するコンポーネント
 */
export const ChatMessageCard = (props: { message: TD.ChatRoomMessage }) => {
  return (
    <div
      className="flex flex-col border-[1px] border-solid border-white p-2"
      key={props.message.id}
    >
      <div className="flex flex-row">
        <div className="m-[1px] bg-white px-[2px] py-0 text-black">
          {props.message.user.displayName}
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
