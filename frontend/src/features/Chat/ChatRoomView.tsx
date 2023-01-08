import { useParams } from 'react-router-dom';

import { useRoomDataReadOnly } from '@/stores/store';

import { RoomView } from './components/RoomView';

export const ChatRoomView = () => {
  const { id } = useParams();
  const room = useRoomDataReadOnly(parseInt(id || ''));
  return <RoomView domain="chat" room={room} />;
};
