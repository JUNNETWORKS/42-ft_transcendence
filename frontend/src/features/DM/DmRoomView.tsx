import * as TD from '@/typedef';
import { FTH3 } from '@/components/FTBasicComponents';
import { SayCard } from '@/components/CommandCard';
import { authAtom } from '@/stores/auth';
import { useAtom } from 'jotai';
import { ChatMessageCard } from '@/components/ChatMessageCard';

const DmRoomMessagesList = (props: { messages: TD.ChatRoomMessage[] }) => {
  return (
    <>
      {props.messages.map((data: TD.ChatRoomMessage) => (
        <ChatMessageCard key={data.id} message={data} />
      ))}
    </>
  );
};

export const DmRoomView = (props: {
  room: TD.DmRoom;
  you: TD.ChatUserRelation | null;
  say: (content: string) => void;
  room_messages: (roomId: number) => TD.ChatRoomMessage[];
  room_members: (roomId: number) => TD.UserRelationMap | null;
}) => {
  const [personalData] = useAtom(authAtom.personalData);
  if (!personalData) return null;

  const roomName = props.room.roomMember.find(
    (member) => member.userId !== personalData.id
  )!.user.displayName;
  return (
    <div className="flex h-full flex-row border-2 border-solid border-white p-2">
      <div className="flex h-full shrink grow flex-col overflow-hidden">
        {/* タイトルバー */}
        <FTH3>{roomName}</FTH3>
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
