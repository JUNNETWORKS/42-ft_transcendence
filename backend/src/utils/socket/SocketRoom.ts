import { RoomType, RoomName } from 'src/types/RoomType';
import { Socket } from 'socket.io';

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

/**
 * Socketをルームに追加する
 * @param client
 * 対象のソケット
 * @param roomType
 * 参加するルームのタイプ
 * @param roomName
 * 参加するルームの名前
 * @returns
 */
export const joinChannel = (client: Socket, roomName: RoomName) => {
  client.join(roomName);
  console.log(`client ${client.id} joined to ${roomName}`);
};
