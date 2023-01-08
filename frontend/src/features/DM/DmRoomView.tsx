import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { authAtom, chatSocketAtom } from '@/stores/auth';
import { useDmRoomDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';

import { makeCommand } from '../Chat/command';
import { RoomView } from '../Chat/components/RoomView';

export const DmRoomView = () => {
  const { id } = useParams();
  const room = useDmRoomDataReadOnly(parseInt(id || ''));
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

  const roomName =
    room.roomMember.find((member) => member.userId !== personalData.id)?.user
      .displayName || '';
  return (
    <RoomView
      domain="dm"
      room={room}
      roomName={roomName}
      mySocket={mySocket}
      personalData={personalData}
    />
  );
};
