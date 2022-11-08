import { Server, Socket } from 'socket.io';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { RoomName } from 'src/types/RoomType';
import { generateFullRoomName } from 'src/utils/socket/SocketRoom';

// TODO: namespace共通化
@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class WsServerGateway {
  @WebSocketServer()
  server: Server;

  socketsInUserChannel(userId: number) {
    const fullUserRoomName = generateFullRoomName({ userId });
    return this.server.in(fullUserRoomName);
  }

  /**
   * 指定したユーザIDに対応するクライアントを指定したルームにjoinさせる\
   * **あらかじめユーザルーム(${userId})にjoinしているクライアントにしか効果がないことに注意！！**
   * @param userId
   * 対象のユーザー
   * @param roomName
   * 対象の部屋名
   */
  async usersJoin(userId: number, roomName: RoomName) {
    const fullUserRoomName = generateFullRoomName({ userId });
    const socks = await this.server.in(fullUserRoomName).allSockets();
    console.log(`joining clients in ${fullUserRoomName} -> ${roomName}`, socks);
    this.server.in(fullUserRoomName).socketsJoin(roomName);
  }

  // TODO: (英語としておかしいので名前を変える)
  /**
   * @param server
   * サーバー
   * @param userId
   * 対象のユーザー
   * @param roomName
   * 対象の部屋名
   */
  async usersLeave(userId: number, roomName: RoomName) {
    const fullUserRoomName = generateFullRoomName({ userId });
    const socks = await this.server.in(fullUserRoomName).allSockets();
    console.log(
      `leaving clients in ${fullUserRoomName} from ${roomName}`,
      socks
    );
    this.server.in(fullUserRoomName).socketsLeave(roomName);
  }

  /**
   * サーバからクライアントに向かってデータを流す
   * @param op
   * イベント名
   * @param roomName
   * 対象の部屋名
   * @param payload
   * データ本体
   */
  sendResultRoom = async (op: string, roomName: RoomName, payload: any) => {
    const socks = await this.server.to(roomName).allSockets();
    console.log('sending downlink to:', roomName, op, payload, socks);
    this.server.to(roomName).emit(op, payload);
  };

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
      await this.sendResultRoom(
        op,
        generateFullRoomName({ userId: target.userId }),
        payload
      );
    }
    if (typeof target.roomId === 'number') {
      await this.sendResultRoom(
        op,
        generateFullRoomName({ roomId: target.roomId }),
        payload
      );
    }
    if (target.global) {
      await this.sendResultRoom(
        op,
        generateFullRoomName({ global: target.global }),
        payload
      );
    }
    if (target.client) {
      console.log('sending downlink to client:', target.client.id, op, payload);
      target.client.emit(op, payload);
    }
  }
}
