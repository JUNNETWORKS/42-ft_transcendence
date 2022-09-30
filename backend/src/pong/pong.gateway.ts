import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PlayerInput } from './game/game-state';
import { Match } from './game/match';

// ========== WS: pong.matchmaking.start ==========
// type MatchmakingEntry = {}

// ========== WS: pong.matchmaking.start ==========
type PlayerAction = PlayerInput;

let match: Match | null = null;
let matchIntervalID: NodeJS.Timer | null = null;

@WebSocketGateway({ cors: true })
export class PongGateway {
  private readonly logger = new Logger('Match WS');

  onApplicationBootstrap() {
    return;
  }

  @SubscribeMessage('connection')
  receiveConnection(client: Socket) {
    this.logger.log(`WebSocket connection ID(${client.id}).`);
  }

  @SubscribeMessage('disconnection')
  receiveDisconnection(client: Socket) {
    this.logger.log(`WebSocket connection ID(${client.id}).`);
  }

  @SubscribeMessage('pong.match.action')
  receivePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerAction: PlayerAction
  ) {
    this.logger.log(`WS: pong.action from ID(${client.id}).`);

    if (!match) {
      match = new Match(client.id, client.id);
    }
    match.moveBar(client.id, playerAction);
    if (!matchIntervalID) {
      matchIntervalID = setInterval(() => {
        if (match) {
          match.updateBall();
          client.emit('pong.match.state', match.getState());
        }
      }, 10);
    }
  }
}
