import { WsServerGateway } from './ws-server.gateway';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RoomArg, RoomType, RoomName } from 'src/types/RoomType';

@Injectable()
export class WsServerService {
  constructor(private readonly wsServer: WsServerGateway) {}

  /**
   * システムが使うルーム名
   * @param roomType
   * @param roomName
   * @returns
   */
  addRoomTypePrefix(roomType: RoomType, roomName: string | number) {
    const roomPrefix = {
      ChatRoom: '#',
      Match: '%',
      User: '$',
      Global: '%',
    }[roomType];
    return `${roomPrefix}${roomName}`;
  }

  generateFullRoomName(roomArg: RoomArg): RoomName {
    if ('roomId' in roomArg)
      return this.addRoomTypePrefix('ChatRoom', roomArg.roomId);
    if ('matchId' in roomArg)
      return this.addRoomTypePrefix('Match', roomArg.matchId);
    else if ('userId' in roomArg)
      return this.addRoomTypePrefix('User', roomArg.userId);
    else if ('global' in roomArg)
      return this.addRoomTypePrefix('Global', roomArg.global);
    else throw new Error('Invalid RoomType');
  }

  async sendResults(
    op: string,
    payload: any,
    target: {
      userId?: number;
      roomId?: number;
      global?: string;
      client?: Socket;
    }
  ) {
    if (typeof target.userId === 'number') {
      await this.wsServer.sendResultRoom(
        op,
        this.generateFullRoomName({ userId: target.userId }),
        payload
      );
    }
    if (typeof target.roomId === 'number') {
      await this.wsServer.sendResultRoom(
        op,
        this.generateFullRoomName({ roomId: target.roomId }),
        payload
      );
    }
    if (target.global) {
      await this.wsServer.sendResultRoom(
        op,
        this.generateFullRoomName({ global: target.global }),
        payload
      );
    }
    if (target.client) {
      console.log('sending downlink to client:', target.client.id, op, payload);
      target.client.emit(op, payload);
    }
  }
}
