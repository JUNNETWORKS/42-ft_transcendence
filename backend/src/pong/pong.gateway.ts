import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PlayerAction } from './dto/player-action';
import { Match } from './game/match';
import { MatchMaker } from './match_managers/match_maker';
import { ProgressingMatchManager } from './match_managers/progressing_match_manager';
import { Server } from 'socket.io';

let match: Match | null = null;
let matchIntervalID: NodeJS.Timer | null = null;

@WebSocketGateway({ cors: true, namespace: '/pong' })
export class PongGateway implements OnGatewayInit {
  private wsServer!: Server;
  private progressingMatchManager!: ProgressingMatchManager;
  private matchMaker!: MatchMaker;
  private clients: Map<string, Socket> = new Map<string, Socket>();

  private readonly logger = new Logger('Match WS');

  afterInit(server: Server) {
    this.wsServer = server;
    this.progressingMatchManager = new ProgressingMatchManager(server);
    this.matchMaker = new MatchMaker(server, this.progressingMatchManager);
  }

  onApplicationBootstrap() {
    return;
  }

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket connection ID(${client.id}).`);
    this.clients.set(client.id, client); // TODO: ユーザー名などにいずれ変える
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket disconnection ID(${client.id}).`);
    this.clients.delete(client.id);

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
    this.matchMaker.entry(client.id);
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
