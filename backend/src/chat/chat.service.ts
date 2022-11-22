import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { User, ChatRoom, ChatUserRelation } from '@prisma/client';

import * as Utils from 'src/utils';

import { PostMessageDto } from '../chatrooms/dto/post-message.dto';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';

import { ChatroomsService } from '../chatrooms/chatrooms.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRoomService: ChatroomsService,
    private readonly userService: UsersService
  ) {}

  async postMessage(data: PostMessageDto) {
    return this.chatRoomService.postMessage(data);
  }

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

  isCallerNomminatableTarget(
    room: ChatRoom,
    caller: ChatUserRelation,
    target: ChatUserRelation
  ): boolean {
    // callerがtargetをnomminateできる条件
    // - targetが当該ルームにjoinしている
    // - targetが当該ルームのOwnerではない
    // - callerが当該ルームのOwnerである or (callerが当該ルームのAdminであり, targetが当該ルームのAdminではない)
    console.log(room, caller, target);
    const targetIsOwner = target.userId === room.ownerId;
    const callerIsOwner = caller.userId === room.ownerId;
    console.log(callerIsOwner, targetIsOwner);
    if (targetIsOwner) {
      return false;
    }
    if (callerIsOwner) {
      return true;
    }
    console.log(caller.memberType, target.memberType);
    if (caller.memberType === 'ADMIN') {
      return true;
    }
    return false;
  }

  isCallerKickableTarget(
    room: ChatRoom,
    caller: ChatUserRelation,
    target: ChatUserRelation
  ): boolean {
    // callerがtargetをkickできる条件
    // - targetが当該ルームにjoinしている
    // - targetが当該ルームのOwnerではない
    // - callerが当該ルームのOwnerである or (callerが当該ルームのAdminであり, targetが当該ルームのAdminではない)
    console.log(room, caller, target);
    const targetIsOwner = target.userId === room.ownerId;
    const callerIsOwner = caller.userId === room.ownerId;
    console.log(callerIsOwner, targetIsOwner);
    if (targetIsOwner) {
      return false;
    }
    if (callerIsOwner) {
      return true;
    }
    console.log(caller.memberType, target.memberType);
    if (caller.memberType === 'ADMIN') {
      return true;
    }
    return false;
  }

  isCallerBannableTarget(
    room: ChatRoom,
    caller: ChatUserRelation,
    target: ChatUserRelation
  ): boolean {
    // callerがtargetをbanできる条件
    // - targetが当該ルームにjoinしている
    // - targetが当該ルームのOwnerではない
    // - callerが当該ルームのOwnerである or (callerが当該ルームのAdminであり, targetが当該ルームのAdminではない)
    console.log(room, caller, target);
    const targetIsOwner = target.userId === room.ownerId;
    const callerIsOwner = caller.userId === room.ownerId;
    console.log(callerIsOwner, targetIsOwner);
    if (targetIsOwner) {
      return false;
    }
    if (callerIsOwner) {
      return true;
    }
    console.log(caller.memberType, target.memberType);
    if (caller.memberType === 'ADMIN') {
      return true;
    }
    return false;
  }

  isCallerMutableTarget(
    room: ChatRoom,
    caller: ChatUserRelation,
    target: ChatUserRelation
  ): boolean {
    // callerがtargetをmuteできる条件
    // - targetが当該ルームにjoinしている
    // - targetが当該ルームのOwnerではない
    // - callerが当該ルームのOwnerである or (callerが当該ルームのAdminであり, targetが当該ルームのAdminではない)
    console.log(room, caller, target);
    const targetIsOwner = target.userId === room.ownerId;
    const callerIsOwner = caller.userId === room.ownerId;
    console.log(callerIsOwner, targetIsOwner);
    if (targetIsOwner) {
      return false;
    }
    if (callerIsOwner) {
      return true;
    }
    console.log(caller.memberType, target.memberType);
    if (caller.memberType === 'ADMIN') {
      return true;
    }
    return false;
  }
}
