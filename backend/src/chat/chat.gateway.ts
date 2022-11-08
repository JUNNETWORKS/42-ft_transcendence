import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatroomsService } from 'src/chatrooms/chatrooms.service';
import { OperationGetRoomMembersDto } from 'src/chatrooms/dto/operation-get-room-members';
import { OperationGetRoomMessageDto } from 'src/chatrooms/dto/operation-get-room-message';
import { OperationJoinDto } from 'src/chatrooms/dto/operation-join.dto';
import { OperationLeaveDto } from 'src/chatrooms/dto/operation-leave.dto';
import { OperationOpenDto } from 'src/chatrooms/dto/operation-open.dto';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';
import { UsersService } from 'src/users/users.service';
import { ChatService } from './chat.service';
import { OperationKickDto } from 'src/chatrooms/dto/operation-kick.dto';
import { OperationMuteDto } from 'src/chatrooms/dto/operation-mute.dto';
import { OperationBanDto } from 'src/chatrooms/dto/operation-ban.dto';
import { OperationNomminateDto } from 'src/chatrooms/dto/operation-nomminate.dto';
import * as Utils from 'src/utils';
import {
  generateFullRoomName,
  joinChannel,
  usersLeave,
  usersJoin,
  sendResultRoom,
} from 'src/utils/socket/SocketRoom';
import { OperationFollowDto } from 'src/chatrooms/dto/operation-follow.dto';
import { OperationUnfollowDto } from 'src/chatrooms/dto/operation-unfollow.dto';
import { AuthService } from 'src/auth/auth.service';

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
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
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
    private readonly authService: AuthService
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
    const { visibleRooms, joiningRooms, friends } =
      await this.usersService.collectStartingInfomations(userId);
    const joiningRoomNames = joiningRooms.map((r) =>
      generateFullRoomName({ roomId: r.id })
    );
    console.log(`user ${userId} is joining to: [${joiningRoomNames}]`);

    // [roomへのjoin状態をハードリレーションに同期させる]
    if (joiningRoomNames.length > 0) {
      this.socketsInUserChannel(userId).socketsJoin(joiningRoomNames);
    }
    // (connectionでは入室それ自体の通知は不要)

    // [オンライン状態の変化を全体に通知]
    this.incrementHeartbeat(userId);
    // [TODO: 初期表示に必要な情報をユーザ本人に通知]
    this.sendResults(
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
        friends: friends.map((r) => {
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
    // [TODO: パラメータが正しければチャットルームを作成する]
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
    await usersJoin(this.server, user.id, generateFullRoomName({ roomId }));

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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    // [TODO: 対象チャットルームの存在確認]
    // [TODO: 実行者がチャットルームで発言可能であることの確認]
    const roomId = data.roomId;
    const rel = await Utils.PromiseMap({
      relation: this.chatRoomService.getRelation(roomId, user.id),
      attr: this.chatRoomService.getAttribute(roomId, user.id),
    });
    const relation = rel.relation;
    if (!relation) {
      return;
    }
    // [TODO: mute状態かどうか]
    const isMuted = rel.attr && rel.attr.mutedEndAt > new Date();
    if (isMuted) {
      console.log('** you are muted **');
      return;
    }

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
    this.updateHeartbeat(user.id);
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
    data.callerId = user.id;
    const userId = user.id;
    const roomId = data.roomId;
    // [TODO: 入室対象のチャットルームが存在していることを確認]
    console.log('ft_join', data);

    const rel = await Utils.PromiseMap({
      room: this.chatRoomService.findOne(roomId),
      relation: this.chatRoomService.getRelation(roomId, user.id),
      attr: this.chatRoomService.getAttribute(roomId, user.id),
    });

    const room = rel.room;
    // [TODO: 実行者が対象チャットルームに入室できることを確認]
    {
      const relation = rel.relation;
      if (relation) {
        return;
      }
    }
    // [TODO: 実行者がbanされていないことを確認]
    if (rel.attr && rel.attr.bannedEndAt > new Date()) {
      console.log('** you are banned **');
      return;
    }

    // [TODO: ハードリレーション更新]
    const member = await this.chatRoomService.addMember(roomId, {
      userId,
      memberType: 'MEMBER',
    });
    console.log('member', member);
    const relation = await this.chatRoomService.getRelationWithUser(
      roomId,
      user.id
    );
    if (!relation) {
      return;
    }

    // [roomへのjoin状態をハードリレーションに同期させる]
    await usersJoin(this.server, user.id, generateFullRoomName({ roomId }));
    // 入室したことを通知
    this.sendResults(
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
    const messages = await this.chatRoomService.getMessages({
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
    this.updateHeartbeat(user.id);
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
    data.callerId = user.id;
    // [TODO: 退出対象のチャットルームが存在していることを確認]
    // [TODO: 実行者が対象チャットルームに入室していることを確認]
    const roomId = data.roomId;
    const relation = await this.chatRoomService.getRelation(roomId, user.id);
    if (!relation) {
      return;
    }
    const chatRoom = relation.chatRoom;

    // [TODO: ハードリレーション更新]
    await this.chatRoomService.removeMember(roomId, user.id);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await usersLeave(this.server, user.id, generateFullRoomName({ roomId }));
    this.sendResults(
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
    this.updateHeartbeat(user.id);
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
    // [TODO: 送信者がjoinしているか？]
    // [TODO: ターゲットがjoinしているか？]
    const roomId = data.roomId;
    const callerId = user.id;
    const targetId = data.userId;
    const rels = await Utils.PromiseMap({
      caller: this.chatRoomService.getRelationWithUser(roomId, callerId),
      target: this.chatRoomService.getRelationWithUser(roomId, targetId),
    });
    if (!rels.caller || !rels.target) {
      return;
    }
    // [TODO: 送信者がADMINまたはオーナーか？]
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
    // [TODO: ターゲットリレーションの `memberType` を `ADMIN` に更新する]
    await this.chatRoomService.updateMember(roomId, {
      ...rels.target,
      memberType: 'ADMIN',
    });
    const newRel = await this.chatRoomService.getRelationWithUser(
      roomId,
      targetId
    );
    console.log('[newRel]', newRel);

    this.sendResults(
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    // [TODO: 送信者がjoinしているか？]
    // [TODO: 対象者がjoinしているか？]
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
    // [TODO: 送信者がADMINまたはオーナーか？]
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
    // [TODO: ハードリレーション更新]
    await this.chatRoomService.removeMember(roomId, targetUser.id);

    // [roomへのjoin状態をハードリレーションに同期させる]
    await usersLeave(
      this.server,
      targetUser.id,
      generateFullRoomName({ roomId })
    );
    this.sendResults(
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    // [TODO: 送信者がjoinしているか？]
    // [TODO: ターゲットがjoinしているか？]
    const roomId = data.roomId;
    const callerId = user.id;
    const targetId = data.userId;
    const rels = await Utils.PromiseMap({
      caller: this.chatRoomService.getRelationWithUser(roomId, callerId),
      target: this.chatRoomService.getRelationWithUser(roomId, targetId),
      targetAttr: this.chatRoomService.getAttribute(roomId, targetId),
    });
    if (!rels.caller || !rels.target) {
      return;
    }
    // [TODO: 送信者がADMINまたはオーナーか？]
    const room = rels.target.chatRoom;
    if (
      !this.chatService.isCallerBannableTarget(room, rels.caller, rels.target)
    ) {
      console.warn("fail: caller doesn't have a right for the operation.");
      return;
    }
    const targetUser = rels.target.user;
    // [TODO: ターゲットのChatUserAttributeの `bannedEndAt` を更新する]
    // なければ新規に作る
    const prolongedBannedEndAt = new Date(Date.now() + constants.banDuration);
    console.log('[old attr]', rels.targetAttr);
    const attr = await this.chatRoomService.upsertAttribute(roomId, targetId, {
      bannedEndAt: prolongedBannedEndAt,
    });
    console.log(prolongedBannedEndAt);
    console.log('[new attr]', attr);

    this.sendResults(
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    // [TODO: 送信者がjoinしているか？]
    // [TODO: ターゲットがjoinしているか？]
    const roomId = data.roomId;
    const callerId = user.id;
    const targetId = data.userId;
    const rels = await Utils.PromiseMap({
      caller: this.chatRoomService.getRelationWithUser(roomId, callerId),
      target: this.chatRoomService.getRelationWithUser(roomId, targetId),
      targetAttr: this.chatRoomService.getAttribute(roomId, targetId),
    });
    if (!rels.caller || !rels.target) {
      return;
    }
    // [TODO: 送信者がADMINまたはオーナーか？]
    const room = rels.target.chatRoom;
    if (
      !this.chatService.isCallerMutableTarget(room, rels.caller, rels.target)
    ) {
      console.warn("fail: caller doesn't have a right for the operation.");
      return;
    }
    const targetUser = rels.target.user;
    // [TODO: ターゲットのChatUserAttributeの `mutedEndAt` を更新する]
    // なければ新規に作る
    const prolongedMutedEndAt = new Date(Date.now() + constants.muteDuration);
    console.log('[old attr]', rels.targetAttr);
    const attr = await this.chatRoomService.upsertAttribute(roomId, targetId, {
      mutedEndAt: prolongedMutedEndAt,
    });
    console.log(prolongedMutedEndAt);
    console.log('[new attr]', attr);

    this.sendResults(
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    const messages = await this.chatRoomService.getMessages({
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    const members = await this.chatRoomService.getMembers(data.roomId);
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

  @SubscribeMessage('ft_follow')
  async handleFollow(
    @MessageBody() data: OperationFollowDto,
    @ConnectedSocket() client: Socket
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
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
    // [TODO: すでにリレーションが存在していないことを確認]
    if (rel.existing) {
      console.log('** already being friend **');
      return;
    }

    // [TODO: ハードリレーション更新]
    await this.usersService.addFriend(user.id, targetId);

    // フォロー**した**ことを通知
    this.sendResults(
      'ft_follow',
      {
        user: Utils.pick(rel.target, 'id', 'displayName'),
      },
      {
        userId: user.id,
      }
    );
    // フォロー**された**ことを通知
    this.sendResults(
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
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
    // [TODO: リレーションが存在していることを確認]
    if (!rel.existing) {
      console.log('** not being friend **');
      return;
    }

    // [TODO: ハードリレーション更新]
    await this.usersService.removeFriend(user.id, targetId);

    // フォロー**した**ことを通知
    this.sendResults(
      'ft_unfollow',
      {
        user: Utils.pick(rel.target, 'id', 'displayName'),
      },
      {
        userId: user.id,
      }
    );
    // フォロー**された**ことを通知
    this.sendResults(
      'ft_unfollowed',
      {
        user: Utils.pick(user, 'id', 'displayName'),
      },
      {
        userId: targetId,
      }
    );
  }

  private socketsInUserChannel(userId: number) {
    const fullUserRoomName = generateFullRoomName({ userId });
    return this.server.in(fullUserRoomName);
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
      await sendResultRoom(
        this.server,
        op,
        generateFullRoomName({ userId: target.userId }),
        payload
      );
    }
    if (typeof target.roomId === 'number') {
      await sendResultRoom(
        this.server,
        op,
        generateFullRoomName({ roomId: target.roomId }),
        payload
      );
    }
    if (target.global) {
      await sendResultRoom(
        this.server,
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

  private updateHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId];
    if (!r) {
      return;
    }
    r.time = Date.now();
    this.heartbeatDict[userId] = r;
    this.sendHeartbeat(userId);
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
    this.sendResults(
      'ft_heartbeat',
      { userId, time: r.time },
      { global: 'global' }
    );
  }

  private sendOffine(userId: number) {
    this.sendResults('ft_offline', { userId }, { global: 'global' });
  }
}
