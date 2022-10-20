import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PongMatchActionDTO } from './dto/pong-match-action';
import { Match } from './game/match';

// ========== WS: pong.match.action ==========

let match: Match | null = null;
let matchIntervalID: NodeJS.Timer | null = null;

@WebSocketGateway({ cors: true, namespace: '/pong' })
export class PongGateway {
  private readonly logger = new Logger('Match WS');

  onApplicationBootstrap() {
    return;
  }

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket connection ID(${client.id}).`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket disconnection ID(${client.id}).`);

    if (matchIntervalID) {
      clearInterval(matchIntervalID);
      matchIntervalID = null;
    }
    if (match) {
      match = null;
    }
  }

  @SubscribeMessage('pong.match.action')
  receivePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerAction: PongMatchActionDTO
  ) {
    if (!match) {
      match = new Match(client.id, client.id);
    }
    if (!matchIntervalID) {
      matchIntervalID = setInterval(() => {
        if (match) {
          match.updateBall();
          match.updateBar();
          client.emit('pong.match.state', match.getState());
        }
      }, 16.66); // 60fps
    }
    match.moveBar(client.id, playerAction);
  }
}
