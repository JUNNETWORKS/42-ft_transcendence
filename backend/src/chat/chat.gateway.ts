import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PostMessageDto } from '../chatrooms/dto/post-message.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: PostMessageDto) {
    const chatMessage = await this.chatService.postMessage(data);
    const broadcastChat = {
      ...chatMessage,
      displayName: await this.chatService.getDisplayName(chatMessage.userId),
    };
    this.server.emit('broadcast', broadcastChat);
  }
}
