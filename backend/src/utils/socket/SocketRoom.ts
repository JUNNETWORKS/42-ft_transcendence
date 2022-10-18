import { RoomType } from 'src/types/RoomType';

/**
 * システムが使うルーム名
 * @param roomType
 * @param roomName
 * @returns
 */
export const generateFullRoomName = (
  roomType: RoomType,
  roomName: string | number
) => {
  const roomSuffix = {
    ChatRoom: '#',
    User: '$',
    Global: '%',
  }[roomType];
  return `${roomSuffix}${roomName}`;
};
