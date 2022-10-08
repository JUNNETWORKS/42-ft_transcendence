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
import { ChatroomsService } from 'src/chatrooms/chatrooms.service';
import { OperationGetRoomMembersDto } from 'src/chatrooms/dto/operation-get-room-members';
import { OperationGetRoomMessageDto } from 'src/chatrooms/dto/operation-get-room-message';
import { OperationJoinDto } from 'src/chatrooms/dto/operation-join.dto';
import { OperationLeaveDto } from 'src/chatrooms/dto/operation-leave.dto';
import { OperationOpenDto } from 'src/chatrooms/dto/operation-open.dto';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';
import { UsersService } from 'src/users/users.service';
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
    private readonly charRoomService: ChatroomsService,
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
    // [システムチャンネルへのjoin]
    this.joinChannel(client, 'User', userId);
    this.joinChannel(client, 'Global', 'global');

    // [ユーザがjoinしているチャットルーム(ハードリレーション)の取得]
    const joiningRooms = (
      await this.charRoomService.getRoomsJoining(userId)
    ).map((r) => r.chatRoom);
    const joiningRoomNames = joiningRooms.map((r) =>
      this.fullRoomName('ChatRoom', r.id)
    );
    console.log(`user ${userId} is joining to: [${joiningRoomNames}]`);

    // [roomへのjoin状態をハードリレーションに同期させる]
    if (joiningRoomNames.length > 0) {
      this.socketsInUserChannel(userId).socketsJoin(joiningRoomNames);
    }
    // (connectionでは入室それ自体の通知は不要)

    // [オンライン状態の変化を全体に通知]
    // TODO: 通知対象をフレンドのみに限定
    this.sendResults(
      'ft_connection_friend',
      {
        userId,
        displayName: user.displayName,
        connectedAt: new Date(),
      },
      {
        global: 'global',
      }
    );
    // [TODO: 初期表示に必要な情報をユーザ本人に通知]
    const visibleRooms = await this.charRoomService.findMany({ take: 40 });
    this.sendResults(
      'ft_connection',
      {
        userId,
        displayName: user.displayName,
        visibleRooms: visibleRooms.map((r) => ({
          id: r.id,
          roomName: r.roomName,
          roomType: r.roomType,
          updatedAt: r.updatedAt,
        })),
        joiningRooms: joiningRooms.map((r) => ({
          id: r.id,
          roomName: r.roomName,
          roomType: r.roomType,
          updatedAt: r.updatedAt,
        })),
      },
      {
        client,
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
      return;
    }
    data.callerId = user.id;
    // [TODO: パラメータが正しければチャットルームを作成する]
    const createdRoom = await this.charRoomService.create({
      roomName: data.roomName,
      roomType: data.roomType,
      ownerId: user.id,
      roomMember: [
        {
          userId: user.id,
          memberType: 'ADMIN',
        },
      ],
    });
    console.log('created', createdRoom);
    const roomId = createdRoom.id;

    // [作成されたチャットルームにjoin]
    await this.usersJoin(user.id, 'ChatRoom', roomId);

    // [新しいチャットルームが作成されたことを通知する]
    this.sendResults(
      'ft_open',
      {
        ...createdRoom,
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
      return;
    }
    data.callerId = user.id;
    // [TODO: 対象チャットルームの存在確認]
    // [TODO: 実行者がチャットルームで発言可能であることの確認]
    const roomId = data.roomId;
    const relation = await this.charRoomService.getRelation(roomId, user.id);
    if (!relation) {
      return;
    }
    const chatRoom = relation.chatRoom;

    // 発言を作成
    const chatMessage = await this.chatService.postMessageBySay(data);
    // 発言内容を通知
    this.sendResults(
      'ft_say',
      {
        ...chatMessage,
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
      return;
    }
    data.callerId = user.id;
    const userId = user.id;
    const roomId = data.roomId;
    // [TODO: 入室対象のチャットルームが存在していることを確認]
    console.log('ft_join', data);
    const room = await this.charRoomService.findOne(roomId);

    // [TODO: 実行者が対象チャットルームに入室できることを確認]
    const relation = await this.charRoomService.getRelation(roomId, user.id);
    if (relation) {
      return;
    }

    // [TODO: ハードリレーション更新]
    const member = await this.charRoomService.addMember(roomId, {
      userId,
      memberType: 'MEMBER',
    });
    console.log('member', member);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.usersJoin(user.id, 'ChatRoom', roomId);
    // 入室したことを通知
    this.sendResults(
      'ft_join',
      {
        room: {
          id: roomId,
          roomName: room.roomName,
        },
        user: {
          id: userId,
          displayName: user.displayName,
        },
      },
      {
        userId: user.id,
        roomId,
      }
    );
    // チャットルームの内容を通知
    const messages = await this.charRoomService.getMessages({
      roomId,
      take: 50,
    });
    this.sendResults(
      'ft_get_room_messages',
      {
        id: roomId,
        messages,
      },
      {
        client,
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
      return;
    }
    data.callerId = user.id;
    // [TODO: 退出対象のチャットルームが存在していることを確認]
    // [TODO: 実行者が対象チャットルームに入室していることを確認]
    const roomId = data.roomId;
    const relation = await this.charRoomService.getRelation(roomId, user.id);
    if (!relation) {
      return;
    }
    const chatRoom = relation.chatRoom;

    // [TODO: ハードリレーション更新]
    await this.charRoomService.removeMember(roomId, user.id);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.usersLeave(user.id, 'ChatRoom', roomId);
    this.sendResults(
      'ft_leave',
      {
        room: {
          id: roomId,
          roomName: chatRoom.roomName,
        },
        user: {
          id: user.id,
          displayName: user.displayName,
        },
      },
      {
        roomId,
        userId: user.id,
      }
    );
  }

  /**
   * @param data
   * @param client
   */
  @SubscribeMessage('ft_get_room_messages')
  async handleRoomMessages(
    @MessageBody() data: OperationGetRoomMessageDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    const messages = await this.charRoomService.getMessages({
      roomId: data.roomId,
      take: data.take,
    });
    this.sendResults(
      'ft_get_room_messages',
      {
        id: data.roomId,
        messages,
      },
      {
        client,
      }
    );
  }

  /**
   *
   * @param data
   * @param client
   * @returns
   */
  @SubscribeMessage('ft_get_room_members')
  async handleRoomMembers(
    @MessageBody() data: OperationGetRoomMembersDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    const members = await this.charRoomService.getMembers(data.roomId);
    this.sendResults(
      'ft_get_room_members',
      {
        id: data.roomId,
        members,
      },
      {
        client,
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

  private socketsInUserChannel(userId: number) {
    const fullUserRoomName = this.fullRoomName('User', userId);
    return this.server.in(fullUserRoomName);
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
      `leaving clients in ${fullUserRoomName} from ${fullChatRoomName}`,
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
      client?: Socket;
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
    if (target.client) {
      console.log('sending downlink to client:', target.client.id, op, payload);
      target.client.emit(op, payload);
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
