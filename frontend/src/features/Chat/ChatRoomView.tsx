import { useAtom } from 'jotai';
import { useParams } from 'react-router-dom';

import { authAtom, chatSocketAtom } from '@/stores/auth';
import { useRoomDataReadOnly } from '@/stores/store';

import { RoomView } from './components/RoomView';

export const ChatRoomView = () => {
  const { id } = useParams();
  const room = useRoomDataReadOnly(parseInt(id || ''));
  const [mySocket] = useAtom(chatSocketAtom);
  const [personalData] = useAtom(authAtom.personalData);
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
