import { Injectable } from '@nestjs/common';
import { PostMessageDto } from '../chatrooms/dto/post-message.dto';
import { ChatroomsService } from '../chatrooms/chatrooms.service';
import { UsersService } from '../users/users.service';
import { WsException } from '@nestjs/websockets';
import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatroomsService: ChatroomsService,
    private readonly userService: UsersService
  ) {}

  async postMessage(data: PostMessageDto) {
    return this.chatroomsService.postMessage(data);
  }

  async postMessageBySay(data: OperationSayDto) {
    return this.chatroomsService.postMessage({
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
}
