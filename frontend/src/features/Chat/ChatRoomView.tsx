import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { authAtom, chatSocketAtom } from '@/stores/auth';
import { useRoomDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';

import { makeCommand } from './command';
import { RoomView } from './components/RoomView';

export const ChatRoomView = () => {
  const { id } = useParams();
  const room = useRoomDataReadOnly(parseInt(id || ''));
  const [mySocket] = useAtom(chatSocketAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const [members] = dataAtom.useMembersInRoom(room?.id || -1);
  const membersExists = !!members;
  useEffect(() => {
    if (!room || !mySocket || !personalData || membersExists) {
      return;
    }
    const command = makeCommand(mySocket, room.id);
    command.get_room_members(room.id);
  }, [membersExists, mySocket, personalData, room]);
  if (!room || !mySocket || !personalData) {
    return null;
  }
  return (
    <RoomView
      domain="chat"
      room={room}
      roomName={room.roomName}
      mySocket={mySocket}
      personalData={personalData}
    />
  );
};
