import { useAtom } from 'jotai';
import { useId, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

import { ChatMessageCard } from '@/components/ChatMessageCard';
import { SayCard } from '@/components/CommandCard';
import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Icons } from '@/icons';
import { authAtom, chatSocketAtom } from '@/stores/auth';
import { useDmRoomDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';

import { makeCommand } from '../Chat/command';

function messageCardId(message: TD.ChatRoomMessage) {
  return `message-${message.id}`;
}
const DmRoomMessagesList = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.DmRoom;
  messages: TD.ChatRoomMessage[];
  members: TD.UserRelationMap;
}) => {
  const listId = useId();
  return (
    <div id={listId} className="h-full overflow-scroll">
      {props.messages.map((data: TD.ChatRoomMessage) => {
        const member = props.members[data.userId];
        return (
          member && (
            <ChatMessageCard
              key={data.id}
              id={messageCardId(data)}
              message={data}
              you={props.you}
              room={props.room}
              userId={data.userId}
              member={member}
              memberOperations={{}}
            />
          )
        );
      })}
    </div>
  );
};

type Prop = {
  room: TD.DmRoom;
  mySocket: ReturnType<typeof io>;
};

const RoomView = ({ room, mySocket }: Prop) => {
  const navigate = useNavigate();
  const [members] = dataAtom.useMembersInRoom(room.id);
  const [messagesInRoom] = useAtom(dataAtom.messagesInRoomAtom);
  const [membersInRoom] = useAtom(dataAtom.membersInRoomAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const computed = {
    you: useMemo(() => {
      if (!personalData) {
        return null;
      }
      const us = membersInRoom[room.id];
      if (!us) {
        return null;
      }
      return us[personalData.id];
    }, [membersInRoom, personalData, room.id]),
  };
  const store = {
    roomMessages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
  };
  const command = makeCommand(mySocket, room.id);
  if (!personalData) {
    return null;
  }

  const roomName = room.roomMember.find(
    (member) => member.userId !== personalData.id
  )!.user.displayName;
  return (
    <div className="flex h-full flex-row border-2 border-solid border-white p-2">
      <div className="flex h-full shrink grow flex-col overflow-hidden">
        {/* タイトルバー */}
        <FTH3 className="flex flex-row items-center">
          <FTButton onClick={() => navigate('/dm')} className="shrink-0 grow-0">
            <Icons.Cancel className="block" />
          </FTButton>

          <div className="shrink-0 grow-0">{roomName}</div>
        </FTH3>
        {/* 今フォーカスしているルームのメッセージ */}
        <div className="shrink grow overflow-scroll border-2 border-solid border-white">
          <DmRoomMessagesList
            you={computed.you}
            room={room}
            members={members}
            messages={store.roomMessages(room.id)}
          />
        </div>
        <div className="shrink-0 grow-0 border-2 border-solid border-white p-2">
          {/* 今フォーカスしているルームへの発言 */}
          <div className="flex flex-row border-2 border-solid border-white p-2">
            <SayCard sender={command.say} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const DmRoomView = () => {
  const { id } = useParams();
  const room = useDmRoomDataReadOnly(parseInt(id || ''));
  const [mySocket] = useAtom(chatSocketAtom);
  if (!room || !mySocket) {
    return null;
  }
  return <RoomView room={room} mySocket={mySocket} />;
};
