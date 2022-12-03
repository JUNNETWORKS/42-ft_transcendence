import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { AuthService } from 'src/auth/auth.service';

import { PongMatchActionDTO } from './dto/pong-match-action.dto';
import { PongMatchMakingEntryDTO } from './dto/pong-match-making-entry.dto';
import { PongMatchMakingLeaveDTO } from './dto/pong-match-making-leave.dto';

import { OngoingMatches } from './game/ongoing-matches';
import { PostMatchStrategy } from './game/PostMatchStrategy';
import { WaitingQueue } from './game/waiting-queue';
import { WaitingQueues } from './game/waiting-queues';

// TODO: フロントのWebSocketのnamespaceを削除してここのものも削除する
// フロント側のWebSocketのコードを利用するために一時的に /chat にしている｡
@WebSocketGateway({ cors: true, namespace: '/chat' })
export class PongGateway {
  private wsServer!: Server;
  private ongoingMatches: OngoingMatches;
  private waitingQueues: WaitingQueues;
  private readonly logger = new Logger('Match WS');

  constructor(
    private readonly authService: AuthService,
    private readonly postMatchStrategy: PostMatchStrategy
  ) {}

  afterInit(server: Server) {
    this.wsServer = server;
    this.ongoingMatches = new OngoingMatches(
      this.wsServer,
      this.postMatchStrategy
    );
    this.waitingQueues = new WaitingQueues();
  }

  onApplicationBootstrap() {
    // 常設のWaitingQueueを作成
    const rankQueue = new WaitingQueue(
      'RANK',
      this.ongoingMatches,
      this.wsServer
    );
    const casualQueue = new WaitingQueue(
      'CASUAL',
      this.ongoingMatches,
      this.wsServer
    );
    this.waitingQueues.appendQueue(rankQueue);
    this.waitingQueues.appendQueue(casualQueue);
    return;
  }

  async handleDisconnect(client: Socket) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      console.log('USER is not logged in!!');
      return;
    }

    this.ongoingMatches.leave(user.id);
    const queue = this.waitingQueues.getQueueByPlayerID(user.id);
    if (queue) {
      queue.remove(user.id);
    }
  }

  @SubscribeMessage('pong.match_making.entry')
  async receiveMatchMakingEntry(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongMatchMakingEntryDTO
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      console.log('USER is not logged in!!');
      return;
    }

    if (this.waitingQueues.getQueueByPlayerID(user.id) !== undefined) {
      // TODO: 既に待機キューに参加している場合はエラーを返す
      return;
    }
    // 待機キューにユーザーを追加する
    const queue = this.waitingQueues.getQueue(data.matchType);
    queue?.append(user.id);
  }

  @SubscribeMessage('pong.match_making.leave')
  async receiveMatchMakingLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongMatchMakingLeaveDTO
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      console.log('USER is not logged in!!');
      return;
    }

    // 待機キューからユーザーを削除する
    const queue = this.waitingQueues.getQueueByPlayerID(user.id);
    queue?.remove(user.id);
  }

  @SubscribeMessage('pong.match.action')
  async receivePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerAction: PongMatchActionDTO
  ) {
    console.log('pong.match.action');
    const user = await this.authService.trapAuth(client);
    if (!user) {
      console.log('USER is not logged in!!');
      return;
    }

    this.ongoingMatches.moveBar(user.id, playerAction);
  }
}
