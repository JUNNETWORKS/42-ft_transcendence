import { Server } from 'socket.io';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { RoomArg, RoomType, RoomName } from 'src/types/RoomType';

@WebSocketGateway()
export class WsServerGateway {
  @WebSocketServer()
  server: Server;

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
}
