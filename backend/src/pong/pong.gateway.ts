import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { PlayerAction } from './dto/player-action';
import { MatchMaker } from './match_managers/match_maker';
import { ProgressingMatchManager } from './match_managers/progressing_match_manager';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/pong' })
export class PongGateway implements OnGatewayInit {
  private wsServer!: Server;
  private progressingMatchManager!: ProgressingMatchManager;
  private matchMaker!: MatchMaker;

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
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket disconnection ID(${client.id}).`);
    this.matchMaker.exit(client.id);
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
    const match = this.progressingMatchManager.findProgressingMatchBySessionID(
      client.id
    );
    if (match) {
      match.moveBar(client.id, playerAction);
    }
  }
}
