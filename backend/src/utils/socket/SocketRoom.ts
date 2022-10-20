import { RoomArg, RoomType, RoomName } from 'src/types/RoomType';
import { Socket, Server } from 'socket.io';

/**
 * システムが使うルーム名
 * @param roomType
 * @param roomName
 * @returns
 */
const addRoomTypePrefix = (roomType: RoomType, roomName: string | number) => {
  const roomPrefix = {
    ChatRoom: '#',
    User: '$',
    Global: '%',
  }[roomType];
  return `${roomPrefix}${roomName}`;
};

export const generateFullRoomName = (roomArg: RoomArg): RoomName => {
  if ('roomId' in roomArg) return addRoomTypePrefix('ChatRoom', roomArg.roomId);
  else if ('userId' in roomArg)
    return addRoomTypePrefix('User', roomArg.userId);
  else if ('global' in roomArg)
    return addRoomTypePrefix('Global', roomArg.global);
  return 'Error';
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

/**
 * 指定したユーザIDに対応するクライアントを指定したルームにjoinさせる\
 * **あらかじめユーザルーム(${userId})にjoinしているクライアントにしか効果がないことに注意！！**
 * @param server
 * サーバー
 * @param userId
 * 対象のユーザー
 * @param roomName
 * 対象の部屋名
 */
export const usersJoin = async (
  server: Server,
  userId: number,
  roomName: RoomName
) => {
  const fullUserRoomName = generateFullRoomName({ userId });
  const socks = await server.in(fullUserRoomName).allSockets();
  console.log(`joining clients in ${fullUserRoomName} -> ${roomName}`, socks);
  server.in(fullUserRoomName).socketsJoin(roomName);
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
  const fullUserRoomName = generateFullRoomName({ userId });
  const socks = await server.in(fullUserRoomName).allSockets();
  console.log(`leaving clients in ${fullUserRoomName} from ${roomName}`, socks);
  server.in(fullUserRoomName).socketsLeave(roomName);
};

/**
 * サーバからクライアントに向かってデータを流す
 * @param server
 * サーバー
 * @param op
 * イベント名
 * @param roomName
 * 対象の部屋名
 * @param payload
 * データ本体
 */
export const sendResultRoom = async (
  server: Server,
  op: string,
  roomName: RoomName,
  payload: any
) => {
  const socks = await server.to(roomName).allSockets();
  console.log('sending downlink to:', roomName, op, payload, socks);
  server.to(roomName).emit(op, payload);
};
