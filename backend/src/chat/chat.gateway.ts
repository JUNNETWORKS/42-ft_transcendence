import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { AuthService } from 'src/auth/auth.service';
import { ChatroomsService } from 'src/chatrooms/chatrooms.service';
import { UsersService } from 'src/users/users.service';
import * as Utils from 'src/utils';
import { generateFullRoomName, joinChannel } from 'src/utils/socket/SocketRoom';

import { OperationBanDto } from 'src/chatrooms/dto/operation-ban.dto';
import { OperationBlockDto } from 'src/chatrooms/dto/operation-block.dto';
import { OperationFollowDto } from 'src/chatrooms/dto/operation-follow.dto';
import { OperationGetRoomMembersDto } from 'src/chatrooms/dto/operation-get-room-members.dto';
import { OperationGetRoomMessageDto } from 'src/chatrooms/dto/operation-get-room-message.dto';
import { OperationJoinDto } from 'src/chatrooms/dto/operation-join.dto';
import { OperationKickDto } from 'src/chatrooms/dto/operation-kick.dto';
import { OperationLeaveDto } from 'src/chatrooms/dto/operation-leave.dto';
import { OperationMuteDto } from 'src/chatrooms/dto/operation-mute.dto';
import { OperationNomminateDto } from 'src/chatrooms/dto/operation-nomminate.dto';
import { OperationOpenDto } from 'src/chatrooms/dto/operation-open.dto';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';
import { OperationTellDto } from 'src/chatrooms/dto/operation-tell.dto';
import { OperationUnblockDto } from 'src/chatrooms/dto/operation-unblock.dto';
import { OperationUnfollowDto } from 'src/chatrooms/dto/operation-unfollow.dto';

import { WsServerGateway } from './../ws-server/ws-server.gateway';
import { Heartbeat } from './chat.heartbeat';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection {
  private heartbeatDict: {
    [userId: number]: {
      n: number;
      time: number;
    };
  } = {};

  constructor(
    private readonly chatService: ChatService,
    private readonly chatRoomService: ChatroomsService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly wsServer: WsServerGateway,
    private readonly heartbeat: Heartbeat
  ) {}

  /**
   * 新しいクライアントが接続してきた時の処理
   * @param client
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const userId = user.id;
    // [システムチャンネルへのjoin]
    //TODO チャットに依存しない機能になりそう
    joinChannel(client, generateFullRoomName({ userId }));
    joinChannel(client, generateFullRoomName({ global: 'global' }));

    // [ユーザがjoinしているチャットルーム(ハードリレーション)の取得]
    const { visibleRooms, joiningRooms, dmRooms, friends, blockingUsers } =
      await this.usersService.collectStartingInformations(userId);
    const joiningRoomNames = [...joiningRooms, ...dmRooms].map((r) =>
      generateFullRoomName({ roomId: r.id })
    );
    console.log(`user ${userId} is joining to: [${joiningRoomNames}]`);

    // [roomへのjoin状態をハードリレーションに同期させる]
    if (joiningRoomNames.length > 0) {
      this.wsServer.socketsInUserChannel(userId).socketsJoin(joiningRoomNames);
    }
    // (connectionでは入室それ自体の通知は不要)

    // [オンライン状態の変化を全体に通知]
    this.heartbeat.incrementHeartbeat(userId);
    // [初期表示に必要な情報をユーザ本人に通知]
    this.wsServer.sendResults(
      'ft_connection',
      {
        userId,
        displayName: user.displayName,
        visibleRooms: visibleRooms.map((r) =>
          Utils.pick(r, 'id', 'roomName', 'roomType', 'ownerId', 'updatedAt')
        ),
        joiningRooms: joiningRooms.map((r) =>
          Utils.pick(r, 'id', 'roomName', 'roomType', 'ownerId', 'updatedAt')
        ),
        dmRooms: dmRooms.map((r) =>
          Utils.pick(
            r,
            'id',
            'roomName',
            'roomType',
            'ownerId',
            'updatedAt',
            'roomMember'
          )
        ),
        friends: friends.map((r) => {
          const h = this.heartbeatDict[r.id];
          return {
            ...Utils.pick(r, 'id', 'displayName'),
            time: h ? h.time : null,
          };
        }),
        blockingUsers: blockingUsers.map((r) => {
          const h = this.heartbeatDict[r.id];
          return {
            ...Utils.pick(r, 'id', 'displayName'),
            time: h ? h.time : null,
          };
        }),
      },
      {
        client,
      }
    );
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const userId = user.id;
    // [オンライン状態の変化を全体に通知]
    this.heartbeat.decrementHeartbeat(userId);
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    // [パラメータが正しければチャットルームを作成する]
    const createdRoom = await this.chatRoomService.create({
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
    await this.wsServer.usersJoin(user.id, { roomId });

    // [新しいチャットルームが作成されたことを通知する]
    this.wsServer.sendResults(
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const chatMessage = await this.chatService.execSay(user, data);
    const roomId = chatMessage.chatRoomId;
    // 発言内容を通知
    this.wsServer.sendResults(
      'ft_say',
      {
        ...chatMessage,
        user: Utils.pick(user, 'id', 'displayName'),
      },
      {
        roomId,
      }
    );
    this.heartbeat.updateHeartbeat(user.id);
  }

  /**
   * DMの新規送信、DMルームの作成とメッセージ送信
   * @param data
   * @param client
   */
  @SubscribeMessage('ft_tell')
  async handleTell(
    @MessageBody() data: OperationTellDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    // DMルームの作成
    const dmRoom = await this.chatRoomService.createDmRoom(user, data);
    const roomId = dmRoom.id;

    // [作成されたDMルームにjoin]
    await this.wsServer.usersJoin(user.id, { roomId });
    await this.wsServer.usersJoin(data.userId, { roomId });

    // [新しいDMルームが作成されたことを通知する]
    this.wsServer.sendResults('ft_tell', dmRoom, { roomId });

    // 発言を作成
    const chatMessage = await this.chatService.execSay(user, {
      ...Utils.pick(data, 'userId', 'content', 'callerId'),
      roomId,
    });
    // 発言内容を通知
    this.wsServer.sendResults(
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
    this.heartbeat.updateHeartbeat(user.id);
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const roomId = data.roomId;
    console.log('ft_join', data);
    const relation = await this.chatRoomService.execJoin(user, data);
    const room = relation.chatRoom;

    console.log('member relation:', relation);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.wsServer.usersJoin(user.id, { roomId });
    // 入室したことを通知
    this.wsServer.sendResults(
      'ft_join',
      {
        relation,
        room: Utils.pick(room, 'id', 'roomName'),
        user: Utils.pick(user, 'id', 'displayName'),
      },
      {
        userId: user.id,
        roomId,
      }
    );
    // チャットルームの内容を通知
    await Utils.PromiseMap({
      messages: (async () => {
        const messages = await this.chatRoomService.getMessages({
          roomId,
          take: 50,
        });
        this.wsServer.sendResults(
          'ft_get_room_messages',
          {
            id: roomId,
            messages,
          },
          {
            client,
          }
        );
      })(),
      members: (async () => {
        const members = await this.chatRoomService.getMembers(roomId);
        this.wsServer.sendResults(
          'ft_get_room_members',
          {
            id: roomId,
            members,
          },
          {
            client,
          }
        );
      })(),
    });
    this.heartbeat.updateHeartbeat(user.id);
    return { status: 'success' };
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const relation = await this.chatRoomService.execLeave(user, data);
    const chatRoom = relation.chatRoom;
    const roomId = chatRoom.id;

    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.wsServer.usersLeave(user.id, { roomId });
    this.wsServer.sendResults(
      'ft_leave',
      {
        relation,
        room: Utils.pick(chatRoom, 'id', 'roomName'),
        user: Utils.pick(user, 'id', 'displayName'),
      },
      {
        roomId,
        userId: user.id,
      }
    );
    this.heartbeat.updateHeartbeat(user.id);
  }

  @SubscribeMessage('ft_nomminate')
  async handleNomminate(
    @MessageBody() data: OperationNomminateDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const newRel = await this.chatService.execManipulateMember(
      'nomminate',
      user,
      data
    );
    const roomId = newRel.chatRoom.id;
    this.wsServer.sendResults(
      'ft_nomminate',
      {
        relation: newRel,
        room: Utils.pick(newRel.chatRoom, 'id', 'roomName'),
        user: Utils.pick(newRel.user, 'id', 'displayName'),
      },
      {
        roomId,
      }
    );
  }

  @SubscribeMessage('ft_kick')
  async handleKick(
    @MessageBody() data: OperationKickDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const newRel = await this.chatService.execManipulateMember(
      'kick',
      user,
      data
    );
    console.log('DONE kick', newRel);
    const roomId = newRel.chatRoom.id;
    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.wsServer.usersLeave(newRel.userId, { roomId });
    console.log('DONE leave');
    this.wsServer.sendResults(
      'ft_kick',
      {
        room: Utils.pick(newRel.chatRoom, 'id', 'roomName'),
        user: Utils.pick(newRel.user, 'id', 'displayName'),
      },
      {
        roomId,
        userId: newRel.userId,
      }
    );
  }

  @SubscribeMessage('ft_ban')
  async handleBan(
    @MessageBody() data: OperationBanDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const { targetRelation } = await this.chatService.execAddAttribute(
      'ban',
      user,
      data
    );
    const roomId = targetRelation.chatRoomId;
    this.wsServer.sendResults(
      'ft_ban',
      {
        room: Utils.pick(targetRelation.chatRoom, 'id', 'roomName'),
        user: Utils.pick(targetRelation.user, 'id', 'displayName'),
      },
      {
        roomId,
      }
    );
  }

  @SubscribeMessage('ft_mute')
  async handleMute(
    @MessageBody() data: OperationMuteDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const { targetRelation } = await this.chatService.execAddAttribute(
      'mute',
      user,
      data
    );
    const roomId = targetRelation.chatRoomId;
    this.wsServer.sendResults(
      'ft_mute',
      {
        room: Utils.pick(targetRelation.chatRoom, 'id', 'roomName'),
        user: Utils.pick(targetRelation.user, 'id', 'displayName'),
      },
      {
        roomId,
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const messages = await this.chatRoomService.getMessages(data);
    this.wsServer.sendResults(
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    const members = await this.chatRoomService.getMembers(data.roomId);
    this.wsServer.sendResults(
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

  @SubscribeMessage('ft_follow')
  async handleFollow(
    @MessageBody() data: OperationFollowDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const target = await this.usersService.execFollowUnfollow(
      'follow',
      user,
      data
    );

    // フォロー**した**ことを通知
    this.wsServer.sendResults(
      'ft_follow',
      {
        user: Utils.pick(target, 'id', 'displayName'),
      },
      {
        userId: user.id,
      }
    );
    // フォロー**された**ことを通知
    this.wsServer.sendResults(
      'ft_followed',
      {
        user: Utils.pick(user, 'id', 'displayName'),
      },
      {
        userId: target.id,
      }
    );
  }

  @SubscribeMessage('ft_unfollow')
  async handleUnfollow(
    @MessageBody() data: OperationUnfollowDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    const target = await this.usersService.execFollowUnfollow(
      'unfollow',
      user,
      data
    );

    // フォロー**した**ことを通知
    this.wsServer.sendResults(
      'ft_unfollow',
      {
        user: Utils.pick(target, 'id', 'displayName'),
      },
      {
        userId: user.id,
      }
    );
    // フォロー**された**ことを通知
    this.wsServer.sendResults(
      'ft_unfollowed',
      {
        user: Utils.pick(user, 'id', 'displayName'),
      },
      {
        userId: target.id,
      }
    );
  }

  @SubscribeMessage('ft_block')
  async handleBlock(
    @MessageBody() data: OperationBlockDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    console.log('ft_block', data);
    const target = await this.usersService.execBlockUnblock(
      'block',
      user,
      data
    );

    // ブロックしたことを通知
    this.wsServer.sendResults(
      'ft_block',
      {
        user: Utils.pick(target, 'id', 'displayName'),
      },
      {
        userId: user.id,
      }
    );
  }

  @SubscribeMessage('ft_unblock')
  async handleUnblock(
    @MessageBody() data: OperationUnblockDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    console.log('ft_unblock', data);
    const target = await this.usersService.execBlockUnblock(
      'unblock',
      user,
      data
    );

    // アンブロックことを通知
    this.wsServer.sendResults(
      'ft_unblock',
      {
        user: Utils.pick(target, 'id', 'displayName'),
      },
      {
        userId: user.id,
      }
    );
  }
}
