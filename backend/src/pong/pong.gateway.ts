import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PlayerAction } from './dto/player-action';
import { Match } from './game/match';
import { MatchMaker } from './match_managers/match_maker';
import { ProgressingMatchManager } from './match_managers/progressing_match_manager';

let match: Match | null = null;
let matchIntervalID: NodeJS.Timer | null = null;
const progressing_match_manager = new ProgressingMatchManager();
const match_maker: MatchMaker = new MatchMaker(progressing_match_manager);

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

  @SubscribeMessage('pong.match_making.entry')
  entryMatchMaking(@ConnectedSocket() client: Socket) {
    match_maker.entry(client.id);
  }

  @SubscribeMessage('pong.match.action')
  receivePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerAction: PlayerAction
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
