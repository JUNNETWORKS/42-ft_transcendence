import { Socket, Server } from 'socket.io';

import { RoomArg, RoomType, RoomName } from 'src/types/RoomType';

/**
 * システムが使うルーム名
 * @param roomType
 * @param roomName
 * @returns
 */
const addRoomTypePrefix = (roomType: RoomType, roomName: string | number) => {
  const roomPrefix = {
    ChatRoom: '#',
    Match: '^',
    MatchMaking: '*',
    User: '$',
    Global: '%',
  }[roomType];
  return `${roomPrefix}${roomName}`;
};

export const generateFullRoomName = (roomArg: RoomArg): RoomName => {
  if ('roomId' in roomArg) return addRoomTypePrefix('ChatRoom', roomArg.roomId);
  if ('matchId' in roomArg) return addRoomTypePrefix('Match', roomArg.matchId);
  if ('matchMakingId' in roomArg)
    return addRoomTypePrefix('MatchMaking', roomArg.matchMakingId);
  else if ('userId' in roomArg)
    return addRoomTypePrefix('User', roomArg.userId);
  else if ('global' in roomArg)
    return addRoomTypePrefix('Global', roomArg.global);
  else throw new Error('Invalid RoomType');
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
