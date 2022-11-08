import * as TD from '@/typedef';
import { FTH3 } from '@/components/FTBasicComponents';
import * as dayjs from 'dayjs';
import { SayCard } from '@/components/CommandCard';

/**
 * メッセージを表示するコンポーネント
 */
const ChatRoomMessageCard = (props: { message: TD.ChatRoomMessage }) => {
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

const DmRoomMessagesList = (props: { messages: TD.ChatRoomMessage[] }) => {
  return (
    <>
      {props.messages.map((data: TD.ChatRoomMessage) => (
        <ChatRoomMessageCard key={data.id} message={data} />
      ))}
    </>
  );
};

export const DmRoomView = (props: {
  room: TD.ChatRoom;
  you: TD.ChatUserRelation | null;
  say: (content: string) => void;
  room_messages: (roomId: number) => TD.ChatRoomMessage[];
  room_members: (roomId: number) => TD.UserRelationMap | null;
}) => {
  return (
    <div className="flex h-full flex-row border-2 border-solid border-white p-2">
      <div className="flex h-full shrink grow flex-col overflow-hidden">
        {/* タイトルバー */}
        <FTH3>{props.room.roomName /* 相手の名前*/}</FTH3>
        {/* 今フォーカスしているルームのメッセージ */}
        <div className="shrink grow overflow-scroll border-2 border-solid border-white">
          <DmRoomMessagesList messages={props.room_messages(props.room.id)} />
        </div>
        <div className="shrink-0 grow-0 border-2 border-solid border-white p-2">
          {/* 今フォーカスしているルームへの発言 */}
          <div className="flex flex-row border-2 border-solid border-white p-2">
            <SayCard sender={props.say} />
          </div>
        </div>
      </div>
      <div className="shrink-0 grow-0 basis-[20em]"></div>
    </div>
  );
};
