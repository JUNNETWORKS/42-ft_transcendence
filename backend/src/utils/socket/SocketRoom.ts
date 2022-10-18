import { RoomType, RoomName } from 'src/types/RoomType';
import { Socket, Server } from 'socket.io';

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

//TODO (英語としておかしいので名前を変える)
/**
 * @param server
 * サーバー
 * @param userId
 * 対象のユーザー
 * @param roomName
 * 対象の部屋名
 */
export const usersLeave = async (
  server: Server,
  userId: number,
  roomName: RoomName
) => {
  const fullUserRoomName = generateFullRoomName('User', userId);
  const socks = await server.in(fullUserRoomName).allSockets();
  console.log(`leaving clients in ${fullUserRoomName} from ${roomName}`, socks);
  server.in(fullUserRoomName).socketsLeave(roomName);
};
