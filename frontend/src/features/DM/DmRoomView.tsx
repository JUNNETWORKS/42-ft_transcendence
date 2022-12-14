import { useAtom } from 'jotai';
import { useParams } from 'react-router-dom';

import { authAtom, chatSocketAtom } from '@/stores/auth';
import { useDmRoomDataReadOnly } from '@/stores/store';

import { RoomView } from '../Chat/components/RoomView';

export const DmRoomView = () => {
  const { id } = useParams();
  const room = useDmRoomDataReadOnly(parseInt(id || ''));
  const [mySocket] = useAtom(chatSocketAtom);
  const [personalData] = useAtom(authAtom.personalData);
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
