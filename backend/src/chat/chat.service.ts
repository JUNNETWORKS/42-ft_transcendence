import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ChatRoom, ChatUserRelation, User } from '@prisma/client';

import * as Utils from 'src/utils';

import { OperationBanDto } from 'src/chatrooms/dto/operation-ban.dto';
import { OperationKickDto } from 'src/chatrooms/dto/operation-kick.dto';
import { OperationMuteDto } from 'src/chatrooms/dto/operation-mute.dto';
import { OperationNomminateDto } from 'src/chatrooms/dto/operation-nomminate.dto';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';

import { ChatroomsService } from '../chatrooms/chatrooms.service';
import { UsersService } from '../users/users.service';

const secondInMilliseconds = 1000;
const minuteInSeconds = 60;
const constants = {
  banDuration: 5 * minuteInSeconds * secondInMilliseconds,
  muteDuration: 5 * minuteInSeconds * secondInMilliseconds,
};

@Injectable()
export class ChatService {
  constructor(
    @Inject(forwardRef(() => ChatroomsService))
    private readonly chatRoomService: ChatroomsService,
    private readonly userService: UsersService
  ) {}

  async postMessageBySay(data: OperationSayDto) {
    return this.chatRoomService.postMessage({
      chatRoomId: data.roomId,
      userId: data.callerId,
      content: data.content,
    });
  }

  async getDisplayName(userId: number | null) {
    if (!userId) {
      throw new WsException('failed to get displayName');
    }
    const res = await this.userService.findOne(userId);
    return res?.displayName;
  }

  async getCallerAndTargetRelation(
    roomId: number,
    callerId: number,
    targetId: number
  ) {
    return Utils.PromiseMap({
      callerRelation: this.chatRoomService.getRelationWithUser(
        roomId,
        callerId
      ),
      targetRelation: this.chatRoomService.getRelationWithUser(
        roomId,
        targetId
      ),
    });
  }

  async getRelationsAndAttribute(
    roomId: number,
    callerId: number,
    targetId: number
  ) {
    const { relations, targetAttr } = await Utils.PromiseMap({
      relations: this.getCallerAndTargetRelation(roomId, callerId, targetId),
      targetAttr: this.chatRoomService.getAttribute(roomId, targetId),
    });
    return {
      ...relations,
      targetAttr,
    };
  }

  async execSay(user: User, data: OperationSayDto) {
    // [対象チャットルームの存在確認]
    // [実行者がチャットルームで発言可能であることの確認]
    const roomId = data.roomId;
    const rel = await Utils.PromiseMap({
      relation: this.chatRoomService.getRelation(roomId, user.id),
      attr: this.chatRoomService.getAttribute(roomId, user.id),
    });
    const relation = rel.relation;
    if (!relation) {
      throw new WsException('not joined');
    }
    // [mute状態かどうか確認]
    const isMuted = rel.attr && rel.attr.mutedEndAt > new Date();
    if (isMuted) {
      throw new WsException('** you are muted **');
    }
    return this.postMessageBySay({
      ...data,
      callerId: user.id,
    });
  }

  async execManipulateMember(
    action: 'nomminate' | 'kick',
    user: User,
    data: OperationNomminateDto | OperationKickDto
  ) {
    // [送信者がjoinしているか？]
    // [対象者がjoinしているか？]
    console.log(action, user, data);
    const roomId = data.roomId;
    const rels = await this.getCallerAndTargetRelation(
      roomId,
      user.id,
      data.userId
    );
    console.log(rels);
    if (!rels.targetRelation || !rels.callerRelation) {
      throw new WsException('no sufficient relation');
    }
    const room = rels.targetRelation.chatRoom;
    if (
      !this.isTargetableFor(
        action,
        room,
        rels.callerRelation,
        rels.targetRelation
      )
    ) {
      throw new WsException(
        "fail: caller doesn't have a right for the operation."
      );
    }
    switch (action) {
      case 'nomminate': {
        await this.chatRoomService.updateMember(roomId, {
          ...rels.targetRelation,
          memberType: 'ADMIN',
        });
        const newRel = await this.chatRoomService.getRelationWithUser(
          roomId,
          rels.targetRelation.userId
        );
        console.log('[newRel]', newRel);
        if (!newRel) {
          throw new WsException('failed to get result');
        }
        return newRel;
      }
      case 'kick': {
        const targetUser = rels.targetRelation.user;
        console.log('EXEC kick');
        // [ハードリレーション更新]
        await this.chatRoomService.removeMember(roomId, targetUser.id);
        return rels.targetRelation;
      }
    }
  }

  async execAddAttribute(
    action: 'ban' | 'mute',
    user: User,
    data: OperationMuteDto | OperationBanDto
  ) {
    const roomId = data.roomId;
    const { callerRelation, targetRelation, targetAttr } =
      await this.getRelationsAndAttribute(roomId, user.id, data.userId);
    if (!callerRelation || !targetRelation) {
      throw new WsException('no sufficient relation');
    }
    // [送信者がADMINまたはオーナーか？]
    const room = targetRelation.chatRoom;
    console.log('[old attr]', targetAttr);
    if (!this.isTargetableFor(action, room, callerRelation, targetRelation)) {
      throw new WsException(
        "fail: caller doesn't have a right for the operation."
      );
    }
    switch (action) {
      case 'ban': {
        const prolongedBannedEndAt = new Date(
          Date.now() + constants.banDuration
        );
        const attr = await this.chatRoomService.upsertAttribute(
          roomId,
          data.userId,
          {
            bannedEndAt: prolongedBannedEndAt,
          }
        );
        console.log(prolongedBannedEndAt);
        console.log('[new attr]', attr);
        break;
      }
      case 'mute': {
        const prolongedMutedEndAt = new Date(
          Date.now() + constants.muteDuration
        );
        const attr = await this.chatRoomService.upsertAttribute(
          roomId,
          data.userId,
          {
            mutedEndAt: prolongedMutedEndAt,
          }
        );
        console.log(prolongedMutedEndAt);
        console.log('[new attr]', attr);
        break;
      }
    }
    return { targetRelation };
  }

  isTargetableFor(
    action: 'nomminate' | 'ban' | 'mute' | 'kick',
    room: ChatRoom,
    caller: ChatUserRelation,
    target: ChatUserRelation
  ) {
    switch (action) {
      case 'nomminate':
      case 'ban':
      case 'mute':
      case 'kick': {
        // - targetが当該ルームにjoinしている
        // - targetが当該ルームのOwnerではない
        // - callerが当該ルームのOwnerである or (callerが当該ルームのAdminであり, targetが当該ルームのAdminではない)
        const targetIsOwner = target.userId === room.ownerId;
        const callerIsOwner = caller.userId === room.ownerId;
        if (targetIsOwner) {
          return false;
        }
        if (callerIsOwner) {
          return true;
        }
        if (caller.memberType === 'ADMIN') {
          return true;
        }
        return false;
      }
    }
  }
}
