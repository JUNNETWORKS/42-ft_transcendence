import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { User } from '@prisma/client';
import { Server, Socket } from 'socket.io';

import { ChatService, SubPayload } from 'src/chat/chat.service';
import { RecordSpecifier } from 'src/chatrooms/chatrooms.service';
import {
  MessageTypeMatching,
  MessageTypeSingle,
  MessageTypeWithPayload,
  MessageTypeWithTarget,
} from 'src/chatrooms/entities/chat-message.entity';
import { RoomArg } from 'src/types/RoomType';
import { generateFullRoomName } from 'src/utils/socket/SocketRoom';

import { OperationSystemSayDto } from 'src/chatrooms/dto/operation-system-say.dto';

// TODO: namespace共通化
@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class WsServerGateway {
  private heartbeatDict: {
    [userId: number]: {
      n: number;
      time: number;
    };
  } = {};

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
   * 対象のルームに接続しているソケットを全てleaveさせる
   * @param roomArg ルーム識別子
   */
  leaveAllSocket(roomArg: RoomArg) {
    const roomName = generateFullRoomName(roomArg);
    this.server.in(roomName).socketsLeave(roomName);
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
    if (op !== 'pong.match.state') {
      console.log('sending downlink to:', roomName, op, payload, socks);
    }
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
      matchId?: string;
      matchMakingId?: string;
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
    if (target.matchId) {
      await this.sendResultRoom(op, payload, { matchId: target.matchId });
    }
    if (target.matchMakingId) {
      await this.sendResultRoom(op, payload, {
        matchMakingId: target.matchMakingId,
      });
    }
    if (target.global) {
      await this.sendResultRoom(op, payload, { global: target.global });
    }
    if (target.client) {
      if (op !== 'pong.match.state') {
        console.log(
          'sending downlink to client:',
          target.client.id,
          op,
          payload
        );
      }
      target.client.emit(op, payload);
    }
  }

  async systemSay(roomId: number, user: User, messageType: MessageTypeSingle) {
    this.systemSayCore(roomId, user, {
      roomId,
      callerId: user.id,
      messageType,
    });
  }

  async systemSaywithPayload(
    roomId: number,
    user: User,
    messageType: MessageTypeWithPayload,
    subpayload: any
  ) {
    this.systemSayCore(roomId, user, {
      roomId,
      callerId: user.id,
      messageType,
      subpayload,
    });
  }

  async systemSayWithTarget(
    roomId: number,
    user: User,
    messageType: MessageTypeWithTarget,
    target: User
  ) {
    this.systemSayCore(roomId, user, {
      roomId,
      callerId: user.id,
      messageType,
      secondaryId: target.id,
    });
  }

  async systemSayMatching(
    roomId: number,
    user: User,
    messageType: MessageTypeMatching,
    matchId: string
  ) {
    this.systemSayCore(roomId, user, {
      roomId,
      callerId: user.id,
      messageType,
      matchId,
      subpayload: {
        status: 'PR_OPEN',
      },
    });
  }

  async updateMatchingMessage(
    specifier: RecordSpecifier,
    matchId: string | null,
    subpayload: SubPayload,
    secondaryUserId?: number
  ) {
    const message = await this.chatService.updateMatchingMessage(
      specifier,
      matchId,
      subpayload,
      secondaryUserId
    );
    this.sendResults(
      'ft_update_message',
      {
        message,
        roomId: message.chatRoomId,
        messageId: message.id,
      },
      {
        roomId: message.chatRoomId,
      }
    );
  }

  private async systemSayCore(
    roomId: number,
    user: User,
    data: OperationSystemSayDto
  ) {
    const systemMessage = await this.chatService.postSystemMessage(data);
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

  incrementHeartbeat(user: User) {
    const r = this.heartbeatDict[user.id] || {
      n: 0,
      time: null,
    };
    r.n += 1;
    r.time = Date.now();
    this.heartbeatDict[user.id] = r;
    this.sendHeartbeat(user);
  }

  pulse(user: User) {
    const r = this.heartbeatDict[user.id];
    if (!r) {
      return;
    }
    r.time = Date.now();
    this.heartbeatDict[user.id] = r;
    try {
      this.sendHeartbeat(user);
    } catch (e) {
      console.error(e);
    }
  }

  decrementHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId];
    if (!r) {
      return;
    }
    r.n -= 1;
    if (r.n) {
      this.heartbeatDict[userId] = r;
    } else {
      delete this.heartbeatDict[userId];
      this.sendOffine(userId);
    }
  }

  private sendHeartbeat(user: User) {
    const r = this.heartbeatDict[user.id];
    if (!r) {
      return;
    }
    const { ongoingMatchId } = user;
    this.sendResults(
      'ft_heartbeat',
      {
        userId: user.id,
        pulseTime: r.time,
        ongoingMatchId: ongoingMatchId || null,
      },
      { global: 'global' }
    );
  }

  private sendOffine(userId: number) {
    this.sendResults('ft_offline', { userId }, { global: 'global' });
  }
}
