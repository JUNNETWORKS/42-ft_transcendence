import { Injectable } from '@nestjs/common';
import { PostMessageDto } from '../chatrooms/dto/post-message.dto';
import { ChatroomsService } from '../chatrooms/chatrooms.service';
import { UsersService } from '../users/users.service';
import { WsException } from '@nestjs/websockets';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';
import * as Utils from 'src/utils';
import { User, ChatRoom, ChatUserRelation } from '@prisma/client';

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

  isCallerKickableTarget(
    room: ChatRoom,
    caller: ChatUserRelation,
    target: ChatUserRelation
  ): boolean {
    // callerがtargetをkickできる条件
    // - targetが当該ルームにjoinしている
    // - targetが当該ルームのOwnerではない
    // - callerが当該ルームのOwnerである or (callerが当該ルームのAdminであり, targetが当該ルームのAdminではない)
    if (target.userId === room.ownerId) {
      return false;
    }
    if (caller.userId === room.ownerId) {
      return true;
    }
    if (caller.memberType === 'ADMIN' && target.memberType !== 'ADMIN') {
      return true;
    }
    return false;
  }
  isCallerMutableTarget(
    room: ChatRoom,
    caller: ChatUserRelation,
    target: ChatUserRelation
  ): boolean {
    // callerがtargetをmuteきる条件
    // - targetが当該ルームにjoinしている
    // - targetが当該ルームのOwnerではない
    // - callerが当該ルームのOwnerである or (callerが当該ルームのAdminであり, targetが当該ルームのAdminではない)
    console.log(room, caller, target);
    console.log(target.userId === room.ownerId);
    if (target.userId === room.ownerId) {
      return false;
    }
    console.log(caller.userId === room.ownerId);
    if (caller.userId === room.ownerId) {
      return true;
    }
    console.log(caller.memberType, target.memberType);
    if (caller.memberType === 'ADMIN' && target.memberType !== 'ADMIN') {
      return true;
    }
    return false;
  }
}
