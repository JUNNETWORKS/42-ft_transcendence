import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { User } from '@prisma/client';
import { Server, Socket } from 'socket.io';

import { ChatService } from 'src/chat/chat.service';
import { MessageType } from 'src/chatrooms/entities/chat-message.entity';
import { RoomArg } from 'src/types/RoomType';
import { generateFullRoomName } from 'src/utils/socket/SocketRoom';

// TODO: namespace共通化
@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class WsServerGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  /**
   * 指定したユーザーIDのルームにjoinしているclientのsocketを取得する
   * @param userId ユーザーID
   * @returns
   */
  socketsInUserChannel(userId: number) {
    const fullUserRoomName = generateFullRoomName({ userId });
    return this.server.in(fullUserRoomName);
  }

  /**
   * 指定したユーザIDに対応するクライアントを指定したルームにjoinさせる\
   * **あらかじめユーザルーム(${userId})にjoinしているクライアントにしか効果がないことに注意！！**
   * @param userId 対象のユーザー
   * @param roomArg 対象のルームの識別子
   */
  async usersJoin(userId: number, roomArg: RoomArg) {
    const fullUserRoomName = generateFullRoomName({ userId });
    const roomName = generateFullRoomName(roomArg);
    const socks = await this.server.in(fullUserRoomName).allSockets();
    console.log(`joining clients in ${fullUserRoomName} -> ${roomName}`, socks);
    this.server.in(fullUserRoomName).socketsJoin(roomName);
  }

  // TODO: (英語としておかしいので名前を変える)
  /**
   * 対象のルームからユーザーIDに対応するクライアントをleaveさせる
   * @param userId ユーザーID
   * @param roomArg 対象のルームの識別子
   */
  async usersLeave(userId: number, roomArg: RoomArg) {
    const fullUserRoomName = generateFullRoomName({ userId });
    const roomName = generateFullRoomName(roomArg);
    const socks = await this.server.in(fullUserRoomName).allSockets();
    console.log(
      `leaving clients in ${fullUserRoomName} from ${roomName}`,
      socks
    );
    this.server.in(fullUserRoomName).socketsLeave(roomName);
  }

  /**
   * サーバからクライアントに向かってデータを流す
   * @param op イベント名
   * @param payload データ本体
   * @param roomArg 対象のルームの識別子
   */
  private async sendResultRoom(op: string, payload: any, roomArg: RoomArg) {
    const roomName = generateFullRoomName(roomArg);
    const socks = await this.server.to(roomName).allSockets();
    console.log('sending downlink to:', roomName, op, payload, socks);
    this.server.to(roomName).emit(op, payload);
  }

  /**
   * targetのルームにopイベントのpayloadを送信する
   * @param op イベント名
   * @param payload データ本体
   * @param target 対象のルーム識別子
   */
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
      await this.sendResultRoom(op, payload, { userId: target.userId });
    }
    if (typeof target.roomId === 'number') {
      await this.sendResultRoom(op, payload, { roomId: target.roomId });
    }
    if (target.global) {
      await this.sendResultRoom(op, payload, { global: target.global });
    }
    if (target.client) {
      console.log('sending downlink to client:', target.client.id, op, payload);
      target.client.emit(op, payload);
    }
  }

  async systemSay(
    roomId: number,
    user: User,
    messageType: MessageType,
    subpayload?: any
  ) {
    const systemMessage = await this.chatService.postSystemMessage({
      roomId,
      callerId: user.id,
      messageType,
      subpayload,
    });
    this.sendResults(
      'ft_say',
      {
        ...systemMessage,
        user: {
          id: user.id,
          displayName: user.displayName,
        },
      },
      {
        roomId,
      }
    );
  }
}
