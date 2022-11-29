import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { PongMatchActionDTO } from './dto/pong-match-action';
import { OnlineMatch } from './game/online-match';

// ========== WS: pong.match.action ==========

const match: OnlineMatch = new OnlineMatch();

@WebSocketGateway({ cors: true, namespace: '/pong' })
export class PongGateway {
  private wsServer!: Server;
  private readonly logger = new Logger('Match WS');

  afterInit(server: Server) {
    this.wsServer = server;
    // 本来はOnlineMatchのコンストラクタで渡す
    match.wsServer = server;
  }

  onApplicationBootstrap() {
    return;
  }

  onApplicationShutdown() {
    match.close();
  }

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket connection ID(${client.id}).`);
    match.joinAsSpectator(client);
    match.joinAsPlayer(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket disconnection ID(${client.id}).`);
    match.leave(client);
  }

  @SubscribeMessage('pong.match.action')
  receivePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerAction: PongMatchActionDTO
  ) {
    match.moveBar(client.id, playerAction);
  }
}
