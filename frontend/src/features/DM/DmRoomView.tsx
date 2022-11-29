import * as TD from '@/typedef';
import { FTH3 } from '@/components/FTBasicComponents';
import { SayCard } from '@/components/CommandCard';
import { authAtom } from '@/stores/auth';
import { useAtom } from 'jotai';
import { ChatMessageCard } from '@/components/ChatMessageCard';

const DmRoomMessagesList = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.DmRoom;
  messages: TD.ChatRoomMessage[];
  members: TD.UserRelationMap;
}) => {
  return (
    <>
      {props.messages.map((data: TD.ChatRoomMessage) => {
        const member = props.members[data.userId];
        return (
          member && (
            <ChatMessageCard
              key={data.id}
              message={data}
              you={props.you}
              room={props.room}
              member={member}
              memberOperations={{}}
            />
          )
        );
      })}
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
  const members = props.room_members(props.room.id);
  if (!personalData || !members) {
    return null;
  }

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
          <DmRoomMessagesList
            you={props.you}
            room={props.room}
            members={members}
            messages={props.room_messages(props.room.id)}
          />
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
