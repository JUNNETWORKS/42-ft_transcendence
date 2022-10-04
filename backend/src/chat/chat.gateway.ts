import { JwtService } from '@nestjs/jwt';
import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { jwtConstants } from 'src/auth/auth.constants';
import { OperationJoinDto } from 'src/chatrooms/dto/operation-join.dto';
import { OperationLeaveDto } from 'src/chatrooms/dto/operation-leave.dto';
import { OperationOpenDto } from 'src/chatrooms/dto/operation-open.dto';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * 新しいクライアントが接続してきた時の処理
   * @param client
   */
  handleConnection(@ConnectedSocket() client: Socket) {
    const payload = this.trapAuth(client);
    const sub = payload['sub'];
    if (sub) {
      this.joinChannel(client, 'User', sub);
      this.joinChannel(client, 'Global', 'global');
    }
  }

  /**
   * チャットルームにおける発言
   * @param data
   * @param client
   */
  @SubscribeMessage('say')
  async handleSay(
    @MessageBody() data: OperationSayDto,
    @ConnectedSocket() client: Socket
  ) {
    const { sub: callerId } = this.trapAuth(client);
    data.callerId = callerId;
    const roomId = data.roomId;
    const chatMessage = await this.chatService.postMessageBySay(data);
    this.downlink(
      'say',
      {
        ...chatMessage,
        displayName: await this.chatService.getDisplayName(chatMessage.userId),
      },
      {
        userId: callerId,
        roomId,
      }
    );
  }

  /**
   * チャットルームへの入室
   * @param data
   * @param client
   */
  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: OperationJoinDto,
    @ConnectedSocket() client: Socket
  ) {
    const { sub: callerId } = this.trapAuth(client);
    data.callerId = callerId;
    const roomId = data.roomId;
    // TODO: ハードリレーション
    this.server
      .in(this.fullRoomName('User', callerId))
      .socketsJoin(this.fullRoomName('ChatRoom', roomId));
    this.downlink(
      'join',
      {
        ...data,
        displayName: await this.chatService.getDisplayName(callerId),
      },
      {
        userId: callerId,
        roomId,
      }
    );
  }

  /**
   * チャットルームからの退出
   * @param data
   * @param client
   */
  @SubscribeMessage('leave')
  async handleLeave(
    @MessageBody() data: OperationLeaveDto,
    @ConnectedSocket() client: Socket
  ) {
    const { sub: callerId } = this.trapAuth(client);
    data.callerId = callerId;
    const roomId = data.roomId;
    // TODO: ハードリレーション
    this.server
      .in(this.fullRoomName('User', callerId))
      .socketsLeave(this.fullRoomName('ChatRoom', roomId));
    this.downlink(
      'leave',
      {
        ...data,
        displayName: await this.chatService.getDisplayName(callerId),
      },
      {
        userId: callerId,
        roomId,
      }
    );
  }

  private trapAuth(client: Socket) {
    if (client.handshake.auth) {
      const token = client.handshake.auth.token;
      if (token) {
        const verified = this.jwtService.verify(token, {
          secret: jwtConstants.secret,
        });
        // console.log(verified);
        const decoded = this.jwtService.decode(token);
        if (decoded && typeof decoded === 'object') {
          return decoded;
        }
      }
    }
    return {};
  }

  /**
   * システムが使うルーム名
   * @param roomType
   * @param roomName
   * @returns
   */
  private fullRoomName(
    roomType: 'ChatRoom' | 'User' | 'Global',
    roomName: any
  ) {
    const roomSuffix = {
      ChatRoom: '#',
      User: '$',
      Global: '%',
    }[roomType];
    return `${roomSuffix}${roomName}`;
  }

  private joinChannel(
    @ConnectedSocket() client: Socket,
    roomType: 'ChatRoom' | 'User' | 'Global',
    roomName: any
  ) {
    const fullRoomName = this.fullRoomName(roomType, roomName);
    client.join(fullRoomName);
    console.log(`client ${client.id} joined to ${fullRoomName}`);
  }

  private downlink(
    op: string,
    payload: any,
    target: {
      userId?: number;
      roomId?: number;
      global?: string;
    }
  ) {
    if (typeof target.userId === 'number') {
      this.sendDownlink(op, 'User', target.userId, payload);
    }
    if (typeof target.roomId === 'number') {
      this.sendDownlink(op, 'ChatRoom', target.roomId, payload);
    }
    if (target.global) {
      this.sendDownlink(op, 'Global', target.global, payload);
    }
  }

  /**
   * サーバからクライアントに向かってデータを流す
   * @param roomType
   * @param roomName
   * @param payload
   */
  private sendDownlink(
    op: string,
    roomType: 'ChatRoom' | 'User' | 'Global',
    roomName: any,
    payload: any
  ) {
    const fullName = this.fullRoomName(roomType, roomName);
    console.log('sending downlink to:', fullName, payload);
    this.server.to(fullName).emit(op, payload);
  }
}
