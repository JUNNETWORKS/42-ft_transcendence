import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatroomsService } from 'src/chatrooms/chatrooms.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatroomsService: ChatroomsService) {}

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): void {
    console.log(data);
    this.server.emit('broadcast', data);
  }
}
