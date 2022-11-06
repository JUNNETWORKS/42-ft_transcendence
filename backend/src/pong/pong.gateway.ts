import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { PongMatchActionDTO } from './dto/pong-match-action.dto';
import { OngoingMatches } from './game/ongoing-matches';
import { WaitingQueues } from './game/waiting-queues';
import { PongMatchMakingEntryDTO } from './dto/pong-match-making-entry.dto';
import { WaitingQueue } from './game/waiting-queue';
import { PongMatchMakingCreateDTO } from './dto/pong-match-making-create.dto';
import { generateMatchID } from './game/utils';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({ cors: true, namespace: '/pong' })
export class PongGateway {
  private wsServer!: Server;
  private ongoingMatches: OngoingMatches;
  private waitingQueues: WaitingQueues;
  private readonly logger = new Logger('Match WS');

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server) {
    this.wsServer = server;
    this.ongoingMatches = new OngoingMatches(this.wsServer);
    this.waitingQueues = new WaitingQueues(this.ongoingMatches);
  }

  onApplicationBootstrap() {
    // CASUAL の待機キューを作成
    const rankQueue = new WaitingQueue('RANK', this.ongoingMatches);
    const casualQueue = new WaitingQueue('CASUAL', this.ongoingMatches);
    this.waitingQueues.appendQueue(rankQueue);
    this.waitingQueues.appendQueue(casualQueue);
    return;
  }

  async handleDisconnect(client: Socket) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    this.ongoingMatches.leave(user.id);
    const queue = this.waitingQueues.getQueueByPlayerID(user.id);
    if (queue) {
      queue.remove(user.id);
    }
  }

  @SubscribeMessage('pong.match_making.create')
  receiveMatchMakingCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongMatchMakingCreateDTO
  ) {
    if (data.queueType === 'private') {
      // プライベートマッチ用の待機キューを作成する｡
      const matchID = generateMatchID();
      const queue = new WaitingQueue(matchID, this.ongoingMatches, {
        maxWaiters: 2,
      }); // TODO: タイムアウトと最大人数を設定する
      this.waitingQueues.appendQueue(queue);
      // クライアントに待機キュー作成完了通知を送信
      client.emit('pong.match_making.created', {
        id: matchID,
      });
    }
  }

  @SubscribeMessage('pong.match_making.entry')
  async receiveMatchMakingEntry(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongMatchMakingEntryDTO
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    // 待機キューにユーザーを追加する
    const queue = this.waitingQueues.getQueue(data.queueID);
    queue?.append(user.id);
  }

  @SubscribeMessage('pong.match.action')
  async receivePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerAction: PongMatchActionDTO
  ) {
    const user = await this.authService.trapAuth(client);
    if (!user) {
      return;
    }
    this.ongoingMatches.moveBar(user.id, playerAction);
  }
}
