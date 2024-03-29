import { useParams } from 'react-router-dom';

import { useDmRoomDataReadOnly } from '@/stores/store';

import { RoomView } from '../Chat/components/RoomView';

export const DmRoomView = () => {
  const { id } = useParams();
  const room = useDmRoomDataReadOnly(parseInt(id || ''));
  return <RoomView domain="dm" room={room} />;
};
