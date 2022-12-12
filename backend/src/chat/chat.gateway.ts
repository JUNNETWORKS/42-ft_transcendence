import { UseGuards } from '@nestjs/common';
import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { User } from '@prisma/client';
import { Socket } from 'socket.io';

import { AuthService } from 'src/auth/auth.service';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { ChatroomsService } from 'src/chatrooms/chatrooms.service';
import { UsersService } from 'src/users/users.service';
import * as Utils from 'src/utils';
import { generateFullRoomName, joinChannel } from 'src/utils/socket/SocketRoom';
import { getUserFromClient } from 'src/utils/socket/ws-auth';

import { OperationInviteDto } from './dto/operation-invite.dto';
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
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';
import { OperationTellDto } from 'src/chatrooms/dto/operation-tell.dto';
import { OperationUnblockDto } from 'src/chatrooms/dto/operation-unblock.dto';
import { OperationUnfollowDto } from 'src/chatrooms/dto/operation-unfollow.dto';

import { WsServerGateway } from './../ws-server/ws-server.gateway';
import { ChatService } from './chat.service';

const secondInMilliseconds = 1000;
const minuteInSeconds = 60;

const constants = {
  banDuration: 5 * minuteInSeconds * secondInMilliseconds,
  muteDuration: 5 * minuteInSeconds * secondInMilliseconds,
};

@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
@UseGuards(WsAuthGuard)
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
    private readonly wsServer: WsServerGateway
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
    const joiningRoomNames = [
      ...joiningRooms.map((r) => r.chatRoom),
      ...dmRooms,
    ].map((r) => generateFullRoomName({ roomId: r.id }));
    console.log(`user ${userId} is joining to: [${joiningRoomNames}]`);

    // [roomへのjoin状態をハードリレーションに同期させる]
    if (joiningRoomNames.length > 0) {
      this.wsServer.socketsInUserChannel(userId).socketsJoin(joiningRoomNames);
    }
    // (connectionでは入室それ自体の通知は不要)

    // [オンライン状態の変化を全体に通知]
    this.incrementHeartbeat(userId);
    // [初期表示に必要な情報をユーザ本人に通知]
    this.wsServer.sendResults(
      'ft_connection',
      {
        userId,
        displayName: user.displayName,
        visibleRooms: visibleRooms.map((r) =>
          Utils.pick(
            r,
            'id',
            'roomName',
            'roomType',
            'ownerId',
            'createdAt',
            'updatedAt',
            'owner'
          )
        ),
        joiningRooms: joiningRooms.map((r) => ({
          chatRoom: Utils.pick(
            r.chatRoom,
            'id',
            'roomName',
            'roomType',
            'ownerId',
            'createdAt',
            'updatedAt',
            'owner'
          ),
          createdAt: r.createdAt,
        })),
        dmRooms: dmRooms.map((r) =>
          Utils.pick(
            r,
            'id',
            'roomName',
            'roomType',
            'ownerId',
            'createdAt',
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
    this.decrementHeartbeat(userId);
  }

  /**
   * チャットルームを作成する -> POST /chatrooms
   */

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
    const user = getUserFromClient(client);
    this.pulse(user);
    // [対象チャットルームの存在確認]
    // [実行者がチャットルームで発言可能であることの確認]
    const roomId = data.roomId;
    const rel = await Utils.PromiseMap({
      relation: this.chatRoomService.getRelation(roomId, user.id),
      attr: this.chatRoomService.getAttribute(roomId, user.id),
    });
    const relation = rel.relation;
    if (!relation) {
      return;
    }
    // [mute状態かどうか確認]
    const isMuted = rel.attr && rel.attr.mutedEndAt > new Date();
    if (isMuted) {
      console.log('** you are muted **');
      return;
    }

    // 発言を作成
    const chatMessage = await this.chatService.postMessageBySay({
      ...data,
      userId: user.id,
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
    const user = getUserFromClient(client);
    this.pulse(user);
    // DMルームの作成
    const dmRoom = await this.chatRoomService.create({
      roomName: `dm-uId${user.id}-uId${data.userId}`,
      roomType: 'DM',
      ownerId: user.id,
      roomMember: [
        { userId: user.id, memberType: 'ADMIN' },
        { userId: data.userId, memberType: 'ADMIN' },
      ],
    });
    const roomId = dmRoom.id;

    // [作成されたDMルームにjoin]
    await this.wsServer.usersJoin(user.id, { roomId });
    await this.wsServer.usersJoin(data.userId, { roomId });

    // [新しいDMルームが作成されたことを通知する]
    this.wsServer.sendResults('ft_tell', dmRoom, { roomId });

    // 発言を作成
    const chatMessage = await this.chatService.postMessageBySay({
      roomId,
      content: data.content,
      userId: user.id,
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
    const user = getUserFromClient(client);
    this.pulse(user);
    const userId = user.id;
    const roomId = data.roomId;
    console.log('ft_join', data);

    const rel = await Utils.PromiseMap({
      room: this.chatRoomService.findOne(roomId),
      relation: this.chatRoomService.getRelation(roomId, user.id),
      attr: this.chatRoomService.getAttribute(roomId, user.id),
    });

    // [ 入室対象のチャットルームが存在していることを確認 ]
    if (!rel.room) {
      return { status: 'not found' };
    }
    const room = rel.room;
    // [ 既に入室していないか確認 ]
    {
      const relation = rel.relation;
      if (relation) {
        return { status: 'joined already' };
      }
    }
    // [ 実行者がbanされていないことを確認 ]
    if (rel.attr && rel.attr.bannedEndAt > new Date()) {
      console.log('** you are banned **');
      return { status: 'banned' };
    }
    // lockedの場合、パスワードのチェック
    if (room.roomType === 'LOCKED') {
      if (!data.roomPassword) {
        return { status: 'no password' };
      }
      // hash化されたパスワードをチェックする
      const hashed = this.chatRoomService.hash_password(data.roomPassword);
      if (room.roomPassword !== hashed) {
        return { status: 'invalid password' };
      }
    }

    // [ハードリレーション更新]
    const relation = await this.chatRoomService.addMember(roomId, {
      userId,
      memberType: 'MEMBER',
    });
    console.log('member relation:', relation);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.wsServer.usersJoin(user.id, { roomId });
    // 入室システムメッセージを生成して通知
    this.wsServer.systemSay(roomId, user, 'JOINED');
    // 入室したことを通知
    this.wsServer.sendResults(
      'ft_join',
      {
        relation,
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
    const user = getUserFromClient(client);
    this.pulse(user);
    // [退出対象のチャットルームが存在していることを確認]
    // [実行者が対象チャットルームに入室していることを確認]
    const roomId = data.roomId;
    const relation = await this.chatRoomService.getRelation(roomId, user.id);
    if (!relation) {
      return;
    }
    const chatRoom = relation.chatRoom;

    // [ハードリレーション更新]
    await this.chatRoomService.removeMember(roomId, user.id);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.wsServer.usersLeave(user.id, { roomId });
    // 退出システムメッセージを生成して通知
    this.wsServer.systemSay(roomId, user, 'LEFT');
    // 退出したことを通知
    this.wsServer.sendResults(
      'ft_leave',
      {
        relation,
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
   * privateルームへの招待（強制入室
   * @param data
   * @param client
   */
  @SubscribeMessage('ft_invite')
  async handleInvite(
    @MessageBody() data: OperationInviteDto,
    @ConnectedSocket() client: Socket
  ) {
    const caller = await this.authService.trapAuth(client);
    if (!caller) {
      return;
    }
    this.pulse(caller);
    const callerId = caller.id;
    const roomId = data.roomId;
    console.log('ft_invite', data);

    const rel = await Utils.PromiseMap({
      room: this.chatRoomService.findOne(roomId),
      relation: this.chatRoomService.getRelation(roomId, callerId),
      attr: this.chatRoomService.getAttribute(roomId, callerId),
    });

    // [ 入室対象のチャットルームが存在していることを確認 ]
    if (!rel.room) {
      return { status: 'not found' };
    }
    const room = rel.room;
    // [ 実行者がオーナーであることの確認 ]
    if (room.ownerId !== callerId) {
      return { status: 'caller is not owner' };
    }
    // [ 実行者が入室していることの確認 ]
    {
      const relation = rel.relation;
      if (!relation) {
        return { status: 'caller is not joined' };
      }
    }
    // TODO: オーナーはbanされることがあるか確認
    // [ 実行者がbanされていないことを確認 ]
    if (rel.attr && rel.attr.bannedEndAt > new Date()) {
      console.log('** you are banned **');
      return { status: 'banned' };
    }

    const usersRel = await Promise.all(
      data.users.map(async (userId) => {
        return await Utils.PromiseMap({
          user: this.usersService.findOne(userId),
          relation: this.chatRoomService.getRelation(roomId, userId),
          isBlocking: this.usersService.findBlocked(userId, callerId),
        });
      })
    );
    // 招待されるユーザーが存在していることの確認
    // 招待されるユーザーが既に入室していないことの確認
    usersRel.forEach((rel) => {
      if (!rel.user) return { status: 'user does not exist' };
      if (rel.relation) return { stats: 'user is joined already' };
    });
    // 招待するユーザーからblockされていた時、除外する（この時、banされているユーザーには通知しないことにする）
    const targetUsers = usersRel
      .filter((rel) => !rel.isBlocking)
      .map((rel) => rel.user!.id);

    // [ハードリレーション更新]
    const result = await this.chatRoomService.addMembers(roomId, targetUsers);
    console.log('invite result:', result); // { count: 3 } とかになる

    // [roomへのjoin状態をハードリレーションに同期させる]
    await Promise.all(
      targetUsers.map(async (userId) => {
        await this.wsServer.usersJoin(userId, { roomId });
      })
    );

    // 入室したユーザーに対して入室したことを通知
    await Promise.all(
      targetUsers.map(async (userId) => {
        const relation = await this.chatRoomService.getRelationWithUser(
          roomId,
          userId
        );
        this.wsServer.sendResults(
          'ft_join',
          {
            relation,
            room: {
              id: roomId,
              roomName: room.roomName,
            },
            user: {
              id: userId,
              displayName: relation?.user.displayName,
            },
          },
          {
            userId,
            roomId,
          }
        );
      })
    );

    // チャットルームの内容を通知
    const messages = await this.chatRoomService.getMessages({
      roomId,
      take: 50,
    });
    const members = await this.chatRoomService.getMembers(roomId);

    await Promise.all(
      targetUsers.map(async (userId) => {
        await this.wsServer.sendResults(
          'ft_get_room_messages',
          {
            id: roomId,
            messages,
          },
          { userId }
        );
        await this.wsServer.sendResults(
          'ft_get_room_members',
          {
            id: roomId,
            members,
          },
          { userId }
        );
      })
    );
    return { status: 'success' };
  }

  @SubscribeMessage('ft_nomminate')
  async handleNomminate(
    @MessageBody() data: OperationNomminateDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = getUserFromClient(client);
    this.pulse(user);
    // [送信者がjoinしているか？]
    // [ターゲットがjoinしているか？]
    const roomId = data.roomId;
    const targetId = data.userId;
    const rels = await Utils.PromiseMap({
      caller: this.chatRoomService.getRelationWithUser(roomId, user.id),
      target: this.chatRoomService.getRelationWithUser(roomId, targetId),
    });
    if (!rels.caller || !rels.target) {
      return;
    }
    // [送信者がADMINまたはオーナーか？]
    const room = rels.target.chatRoom;
    if (
      !this.chatService.isCallerNomminatableTarget(
        room,
        rels.caller,
        rels.target
      )
    ) {
      console.warn("fail: caller doesn't have a right for the operation.");
      return;
    }
    const targetUser = rels.target.user;
    // [ターゲットリレーションの `memberType` を `ADMIN` に更新する]
    await this.chatRoomService.updateMember(roomId, {
      ...rels.target,
      memberType: 'ADMIN',
    });
    const newRel = await this.chatRoomService.getRelationWithUser(
      roomId,
      targetId
    );
    console.log('[newRel]', newRel);

    this.wsServer.systemSayWithTarget(roomId, user, 'NOMMINATED', targetUser);
    this.wsServer.sendResults(
      'ft_nomminate',
      {
        relation: newRel,
        room: Utils.pick(room, 'id', 'roomName'),
        user: Utils.pick(targetUser, 'id', 'displayName'),
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
    const user = getUserFromClient(client);
    this.pulse(user);
    // [送信者がjoinしているか？]
    // [対象者がjoinしているか？]
    const roomId = data.roomId;
    const rels = await this.chatService.getCallerAndTargetRelation(
      roomId,
      user.id,
      data.userId
    );
    console.log('targetRelation', rels.targetRelation);
    console.log('callerRelation', rels.callerRelation);
    if (!rels.targetRelation || !rels.callerRelation) {
      return;
    }
    // [送信者がADMINまたはオーナーか？]
    const room = rels.targetRelation.chatRoom;
    if (
      !this.chatService.isCallerKickableTarget(
        room,
        rels.callerRelation,
        rels.targetRelation
      )
    ) {
      console.warn("fail: caller doesn't have a right for the operation.");
      return;
    }
    const targetUser = rels.targetRelation.user;
    // [ハードリレーション更新]
    await this.chatRoomService.removeMember(roomId, targetUser.id);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await this.wsServer.usersLeave(targetUser.id, { roomId });

    this.wsServer.systemSayWithTarget(roomId, user, 'KICKED', targetUser);
    this.wsServer.sendResults(
      'ft_kick',
      {
        room: Utils.pick(room, 'id', 'roomName'),
        user: Utils.pick(targetUser, 'id', 'displayName'),
      },
      {
        roomId,
        userId: targetUser.id,
      }
    );
  }

  @SubscribeMessage('ft_ban')
  async handleBan(
    @MessageBody() data: OperationBanDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = getUserFromClient(client);
    this.pulse(user);
    // [送信者がjoinしているか？]
    // [ターゲットがjoinしているか？]
    const roomId = data.roomId;
    const targetId = data.userId;
    const rels = await Utils.PromiseMap({
      caller: this.chatRoomService.getRelationWithUser(roomId, user.id),
      target: this.chatRoomService.getRelationWithUser(roomId, targetId),
      targetAttr: this.chatRoomService.getAttribute(roomId, targetId),
    });
    if (!rels.caller || !rels.target) {
      return;
    }
    // [送信者がADMINまたはオーナーか？]
    const room = rels.target.chatRoom;
    if (
      !this.chatService.isCallerBannableTarget(room, rels.caller, rels.target)
    ) {
      console.warn("fail: caller doesn't have a right for the operation.");
      return;
    }
    const targetUser = rels.target.user;
    // [ターゲットのChatUserAttributeの `bannedEndAt` を更新する]
    // なければ新規に作る
    const prolongedBannedEndAt = new Date(Date.now() + constants.banDuration);
    console.log('[old attr]', rels.targetAttr);
    const attr = await this.chatRoomService.upsertAttribute(roomId, targetId, {
      bannedEndAt: prolongedBannedEndAt,
    });
    console.log(prolongedBannedEndAt);
    console.log('[new attr]', attr);

    this.wsServer.systemSayWithTarget(roomId, user, 'BANNED', targetUser);
    this.wsServer.sendResults(
      'ft_ban',
      {
        room: Utils.pick(room, 'id', 'roomName'),
        user: Utils.pick(targetUser, 'id', 'displayName'),
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
    const user = getUserFromClient(client);
    this.pulse(user);
    // [送信者がjoinしているか？]
    // [ターゲットがjoinしているか？]
    const roomId = data.roomId;
    const targetId = data.userId;
    const rels = await Utils.PromiseMap({
      caller: this.chatRoomService.getRelationWithUser(roomId, user.id),
      target: this.chatRoomService.getRelationWithUser(roomId, targetId),
      targetAttr: this.chatRoomService.getAttribute(roomId, targetId),
    });
    if (!rels.caller || !rels.target) {
      return;
    }
    // [送信者がADMINまたはオーナーか？]
    const room = rels.target.chatRoom;
    if (
      !this.chatService.isCallerMutableTarget(room, rels.caller, rels.target)
    ) {
      console.warn("fail: caller doesn't have a right for the operation.");
      return;
    }
    const targetUser = rels.target.user;
    // [ターゲットのChatUserAttributeの `mutedEndAt` を更新する]
    // なければ新規に作る
    const prolongedMutedEndAt = new Date(Date.now() + constants.muteDuration);
    console.log('[old attr]', rels.targetAttr);
    const attr = await this.chatRoomService.upsertAttribute(roomId, targetId, {
      mutedEndAt: prolongedMutedEndAt,
    });
    console.log(prolongedMutedEndAt);
    console.log('[new attr]', attr);

    this.wsServer.systemSayWithTarget(roomId, user, 'MUTED', targetUser);
    this.wsServer.sendResults(
      'ft_mute',
      {
        room: Utils.pick(room, 'id', 'roomName'),
        user: Utils.pick(targetUser, 'id', 'displayName'),
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
    const user = getUserFromClient(client);
    this.pulse(user);
    const messages = await this.chatRoomService.getMessages({
      roomId: data.roomId,
      take: data.take,
      cursor: data.cursor,
    });
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
    const user = getUserFromClient(client);
    this.pulse(user);
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
    const user = getUserFromClient(client);
    this.pulse(user);
    const targetId = data.userId;
    console.log('ft_follow', data);

    if (user.id === data.userId) {
      console.log('is you!!');
      return;
    }
    const rel = await Utils.PromiseMap({
      target: this.usersService.findOne(targetId),
      existing: this.usersService.findFriend(user.id, targetId),
    });
    if (!rel.target) {
      console.log('** unexisting target user **');
      return;
    }
    // [すでにリレーションが存在していないことを確認]
    if (rel.existing) {
      console.log('** already being friend **');
      return;
    }

    // [ハードリレーション更新]
    await this.usersService.addFriend(user.id, targetId);

    // フォロー**した**ことを通知
    this.wsServer.sendResults(
      'ft_follow',
      {
        user: Utils.pick(rel.target, 'id', 'displayName'),
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
        userId: targetId,
      }
    );
  }

  @SubscribeMessage('ft_unfollow')
  async handleUnfollow(
    @MessageBody() data: OperationUnfollowDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = getUserFromClient(client);
    this.pulse(user);
    const targetId = data.userId;
    console.log('ft_unfollow', data);

    const rel = await Utils.PromiseMap({
      target: this.usersService.findOne(targetId),
      existing: this.usersService.findFriend(user.id, targetId),
    });
    if (!rel.target) {
      console.log('** unexisting target user **');
      return;
    }
    // [リレーションが存在していることを確認]
    if (!rel.existing) {
      console.log('** not being friend **');
      return;
    }

    // [ハードリレーション更新]
    await this.usersService.removeFriend(user.id, targetId);

    // フォロー**した**ことを通知
    this.wsServer.sendResults(
      'ft_unfollow',
      {
        user: Utils.pick(rel.target, 'id', 'displayName'),
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
        userId: targetId,
      }
    );
  }

  @SubscribeMessage('ft_block')
  async handleBlock(
    @MessageBody() data: OperationBlockDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = getUserFromClient(client);
    this.pulse(user);
    const targetId = data.userId;
    console.log('ft_block', data);

    if (user.id === data.userId) {
      console.log('is you!!');
      return;
    }
    const rel = await Utils.PromiseMap({
      target: this.usersService.findOne(targetId),
      existing: this.usersService.findBlocked(user.id, targetId),
    });
    if (!rel.target) {
      console.log('** unexisting target user **');
      return;
    }
    // [すでにリレーションが存在していないことを確認]
    if (rel.existing) {
      console.log('** already being blocked **');
      return;
    }

    // [ハードリレーション更新]
    await this.usersService.block(user.id, targetId);

    // ブロックしたことを通知
    this.wsServer.sendResults(
      'ft_block',
      {
        user: Utils.pick(rel.target, 'id', 'displayName'),
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
    const user = getUserFromClient(client);
    this.pulse(user);
    const targetId = data.userId;
    console.log('ft_unblock', data);

    const rel = await Utils.PromiseMap({
      target: this.usersService.findOne(targetId),
      existing: this.usersService.findBlocked(user.id, targetId),
    });
    if (!rel.target) {
      console.log('** unexisting target user **');
      return;
    }
    // [リレーションが存在していることを確認]
    if (!rel.existing) {
      console.log('** not being blocked **');
      return;
    }

    // [ハードリレーション更新]
    await this.usersService.unblock(user.id, targetId);

    // アンブロックことを通知
    this.wsServer.sendResults(
      'ft_unblock',
      {
        user: Utils.pick(rel.target, 'id', 'displayName'),
      },
      {
        userId: user.id,
      }
    );
  }

  private incrementHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId] || {
      n: 0,
      time: null,
    };
    r.n += 1;
    r.time = Date.now();
    this.heartbeatDict[userId] = r;
    this.sendHeartbeat(userId);
  }

  private pulse(user: User) {
    const r = this.heartbeatDict[user.id];
    if (!r) {
      return;
    }
    r.time = Date.now();
    this.heartbeatDict[user.id] = r;
    try {
      this.sendHeartbeat(user.id);
    } catch (e) {
      console.error(e);
    }
    try {
      this.usersService.pulse(user.id);
    } catch (e) {
      console.error(e);
    }
  }

  private decrementHeartbeat(userId: number) {
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

  private sendHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId];
    if (!r) {
      return;
    }
    this.wsServer.sendResults(
      'ft_heartbeat',
      { userId, pulseTime: r.time },
      { global: 'global' }
    );
  }

  private sendOffine(userId: number) {
    this.wsServer.sendResults('ft_offline', { userId }, { global: 'global' });
  }
}
