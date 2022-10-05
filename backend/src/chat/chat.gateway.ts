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
import { UsersService } from 'src/users/users.service';
import { ChatService } from './chat.service';

let iRoomId = 10;

@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}

  /**
   * 新しいクライアントが接続してきた時の処理
   * @param client
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    const user = await this.trapAuth(client);
    if (!user) {
      return;
    }
    const userId = user.id;
    // システムチャンネルへのjoin
    this.joinChannel(client, 'User', userId);
    this.joinChannel(client, 'Global', 'global');
    // TODO: ユーザがjoinしているチャットルーム(ハードリレーション)の取得
    // TODO: roomへのjoin状態をハードリレーションに同期させる
    // (connectionでは入室それ自体の通知は不要)
    // オンライン状態の変化を通知
    this.sendResults(
      'ft_connection',
      {
        userId,
        displayName: user.displayName,
        connectedAt: new Date(),
      },
      {
        global: 'global',
      }
    );
  }

  /**
   * チャットルームを作成する
   * @param data
   * @param client
   */
  @SubscribeMessage('ft_open')
  async handleOpen(
    @MessageBody() data: OperationOpenDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.trapAuth(client);
    if (!user) {
      {
        return;
      }
    }
    data.callerId = user.id;
    // TODO: パラメータが正しければチャットルームを作成する
    const roomId = iRoomId;
    iRoomId += 1;
    // 作成されたチャットルームにjoin
    await this.usersJoin(user.id, 'ChatRoom', roomId);
    // 新しいチャットルームが作成されたことを通知する
    this.sendResults(
      'ft_open',
      {
        roomId,
      },
      {
        global: 'global',
      }
    );
  }

  /**
   * チャットルームにおける発言
   * @param data
   * @param client
   */
  @SubscribeMessage('ft_say')
  async handleSay(
    @MessageBody() data: OperationSayDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.trapAuth(client);
    if (!user) {
      {
        return;
      }
    }
    data.callerId = user.id;
    // TODO: 対象チャットルームの存在確認
    // TODO: 実行者がチャットルームで発言可能であることの確認
    const roomId = data.roomId;
    // 発言を作成
    const chatMessage = await this.chatService.postMessageBySay(data);
    // 発言内容を通知
    this.sendResults(
      'ft_say',
      {
        ...chatMessage,
        displayName: user.displayName,
      },
      {
        roomId,
      }
    );
  }

  /**
   * チャットルームへの入室
   * @param data
   * @param client
   */
  @SubscribeMessage('ft_join')
  async handleJoin(
    @MessageBody() data: OperationJoinDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.trapAuth(client);
    if (!user) {
      {
        return;
      }
    }
    data.callerId = user.id;
    const roomId = data.roomId;
    // TODO: 入室対象のチャットルームが存在していることを確認
    // TODO: 実行者が対象チャットルームに入室できることを確認
    // TODO: ハードリレーション更新
    // roomへのjoin状態をハードリレーションに同期させる
    await this.usersJoin(user.id, 'ChatRoom', roomId);
    // 入室したことを通知
    this.sendResults(
      'ft_join',
      {
        ...data,
        displayName: user.displayName,
      },
      {
        roomId,
      }
    );
  }

  /**
   * チャットルームからの退出
   * @param data
   * @param client
   */
  @SubscribeMessage('ft_leave')
  async handleLeave(
    @MessageBody() data: OperationLeaveDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.trapAuth(client);
    if (!user) {
      {
        return;
      }
    }
    data.callerId = user.id;
    const roomId = data.roomId;
    // TODO: 退出対象のチャットルームが存在していることを確認
    // TODO: 実行者が対象チャットルームに入室していることを確認
    // TODO: ハードリレーション更新
    // roomへのjoin状態をハードリレーションに同期させる
    await this.usersLeave(user.id, 'ChatRoom', roomId);
    this.sendResults(
      'ft_leave',
      {
        ...data,
        displayName: user.displayName,
      },
      {
        roomId,
      }
    );
  }

  private async trapAuth(client: Socket) {
    if (client.handshake.auth) {
      const token = client.handshake.auth.token;
      if (token) {
        const verified = this.jwtService.verify(token, {
          secret: jwtConstants.secret,
        });
        // console.log(verified);
        const decoded = this.jwtService.decode(token);
        if (decoded && typeof decoded === 'object') {
          const sub = decoded['sub'];
          if (sub) {
            const userId = parseInt(sub);
            const user = await this.usersService.findOne(userId);
            if (user) {
              return user;
            }
          }
        }
      }
    }
    return null;
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

  /**
   * 指定したユーザIDに対応するクライアントを指定したルームにjoinさせる\
   * **あらかじめユーザルーム(${userId})にjoinしているクライアントにしか効果がないことに注意！！**
   * @param userId
   * @param roomType
   * @param roomName
   */
  private async usersJoin(
    userId: number,
    roomType: 'ChatRoom' | 'User' | 'Global',
    roomName: any
  ) {
    const fullUserRoomName = this.fullRoomName('User', userId);
    const fullChatRoomName = this.fullRoomName(roomType, roomName);
    const socks = await this.server.in(fullUserRoomName).allSockets();
    console.log(
      `joining clients in ${fullUserRoomName} -> ${fullChatRoomName}`,
      socks
    );
    this.server.in(fullUserRoomName).socketsJoin(fullChatRoomName);
  }

  /**
   * (英語としておかしいので名前を変えること)
   * @param userId
   * @param roomType
   * @param roomName
   */
  private async usersLeave(
    userId: number,
    roomType: 'ChatRoom' | 'User' | 'Global',
    roomName: any
  ) {
    const fullUserRoomName = this.fullRoomName('User', userId);
    const fullChatRoomName = this.fullRoomName(roomType, roomName);
    const socks = await this.server.in(fullUserRoomName).allSockets();
    console.log(
      `leaveing clients in ${fullUserRoomName} from ${fullChatRoomName}`,
      socks
    );
    this.server.in(fullUserRoomName).socketsLeave(fullChatRoomName);
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

  private async sendResults(
    op: string,
    payload: any,
    target: {
      userId?: number;
      roomId?: number;
      global?: string;
    }
  ) {
    if (typeof target.userId === 'number') {
      await this.sendResultRoom(op, 'User', target.userId, payload);
    }
    if (typeof target.roomId === 'number') {
      await this.sendResultRoom(op, 'ChatRoom', target.roomId, payload);
    }
    if (target.global) {
      await this.sendResultRoom(op, 'Global', target.global, payload);
    }
  }

  /**
   * サーバからクライアントに向かってデータを流す
   * @param roomType
   * @param roomName
   * @param payload
   */
  private async sendResultRoom(
    op: string,
    roomType: 'ChatRoom' | 'User' | 'Global',
    roomName: any,
    payload: any
  ) {
    const fullName = this.fullRoomName(roomType, roomName);
    const socks = await this.server.to(fullName).allSockets();
    console.log('sending downlink to:', fullName, op, payload, socks);
    this.server.to(fullName).emit(op, payload);
  }
}