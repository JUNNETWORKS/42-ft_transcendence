import { WsServerGateway } from './../ws-server/ws-server.gateway';
import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
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
import { generateFullRoomName, joinChannel } from 'src/utils/socket/SocketRoom';
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
    const { visibleRooms, joiningRooms, friends } =
      await this.usersService.collectStartingInformations(userId);
    const joiningRoomNames = joiningRooms.map((r) =>
      generateFullRoomName({ roomId: r.id })
    );
    console.log(`user ${userId} is joining to: [${joiningRoomNames}]`);

    // [roomへのjoin状態をハードリレーションに同期させる]
    if (joiningRoomNames.length > 0) {
      this.wsServer.socketsInUserChannel(userId).socketsJoin(joiningRoomNames);
    }
    // (connectionでは入室それ自体の通知は不要)

    // [オンライン状態の変化を全体に通知]
    // TODO: 通知対象をフレンドのみに限定
    this.wsServer.sendResults(
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
        friends: friends.map((r) => Utils.pick(r, 'id', 'displayName')),
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
    await this.wsServer.usersJoin(user.id, { roomId });
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
    await this.wsServer.usersLeave(user.id, { roomId });
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
    await this.wsServer.usersLeave(targetUser.id, { roomId });
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
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    data.callerId = user.id;
    const messages = await this.chatRoomService.getMessages({
      roomId: data.roomId,
      take: data.take,
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
    const targetId = data.userId;
    console.log('ft_follow', data);

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
}
