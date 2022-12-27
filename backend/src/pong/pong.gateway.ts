import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { AuthService } from 'src/auth/auth.service';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { UsersService } from 'src/users/users.service';
import { isfinite } from 'src/utils';
import { getUserFromClient } from 'src/utils/socket/ws-auth';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { PongMatchActionDTO } from './dto/pong-match-action.dto';
import { PongMatchMakingEntryDTO } from './dto/pong-match-making-entry.dto';
import { PongMatchMakingLeaveDTO } from './dto/pong-match-making-leave.dto';
import { PongMatchSpectationDTO } from './dto/pong-match-spectation.dto';
import {
  gameSpeedFactorToGameSpeed,
  PongPrivateMatchCreateDTO,
} from './dto/pong-private-match-create.dto';
import { PongPrivateMatchJoinDTO } from './dto/pong-private-match-join.dto';

import { OngoingMatches } from './game/ongoing-matches';
import { PendingPrivateMatches } from './game/pending-private-matches';
import { PostMatchStrategy } from './game/PostMatchStrategy';
import { WaitingQueue } from './game/waiting-queue';
import { WaitingQueues } from './game/waiting-queues';
import { PongService } from './pong.service';

// TODO: フロントのWebSocketのnamespaceを削除してここのものも削除する
// フロント側のWebSocketのコードを利用するために一時的に /chat にしている｡
@WebSocketGateway({ cors: true, namespace: '/chat' })
@UseGuards(WsAuthGuard)
export class PongGateway {
  private waitingQueues = new WaitingQueues();
  private readonly logger = new Logger('Match WS');

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly pongService: PongService,
    private readonly wsServer: WsServerGateway,
    private readonly postMatchStrategy: PostMatchStrategy,
    private readonly ongoingMatches: OngoingMatches,
    private readonly pendingPrivateMatches: PendingPrivateMatches
  ) {}

  onApplicationBootstrap() {
    // 常設のWaitingQueueを作成
    const rankQueue = new WaitingQueue(
      'RANK',
      this.ongoingMatches,
      this.wsServer,
      this.usersService,
      this.pongService,
      this.postMatchStrategy
    );
    const casualQueue = new WaitingQueue(
      'CASUAL',
      this.ongoingMatches,
      this.wsServer,
      this.usersService,
      this.pongService,
      this.postMatchStrategy
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
    const queue = this.waitingQueues.getQueueByPlayerId(user.id);
    if (queue) {
      queue.remove(user.id);
    }
  }

  // - 待機キュー
  // - 募集中のPrivateMatch
  // - OngoingMatches
  //上記いずれかに参加しているユーザーを弾く
  validateUser = (userId: number) => {
    if (this.waitingQueues.getQueueByPlayerId(userId) !== undefined)
      return false;
    if (this.ongoingMatches.findMatchByPlayer(userId) !== undefined)
      return false;
    if (this.pendingPrivateMatches.getMatchIdByUserId(userId) !== undefined)
      return false;
    return true;
  };

  // プライベートマッチを作成し､参加者を募集する
  @SubscribeMessage('pong.private_match.create')
  async receivePrivateMatchCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongPrivateMatchCreateDTO
  ) {
    const user = getUserFromClient(client);

    if (this.validateUser(user.id) === false)
      return { status: 'rejected', reason: 'user error' };

    const speed = gameSpeedFactorToGameSpeed(data.speed);
    if (!isfinite(data.maxScore) || data.maxScore <= 0) {
      return {
        status: 'rejected',
        reason: 'speed is invalid',
        errors: { maxScore: 'invalid?' },
      };
    }
    const matchId = await this.pendingPrivateMatches.createPrivateMatch(
      user.id,
      data.roomId,
      data.maxScore,
      speed!
    );
    return { status: 'accepted', matchId };
  }

  // 募集中のプライベートに参加する
  @SubscribeMessage('pong.private_match.join')
  async receivePrivateMatchJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongPrivateMatchJoinDTO
  ) {
    const user = getUserFromClient(client);

    if (this.validateUser(user.id) === false) return { status: 'rejected' };

    this.pendingPrivateMatches.joinPrivateMatch(data.matchId, user.id);
  }

  // 募集中のプライベートマッチを抜けて、その募集中マッチを削除する。
  @SubscribeMessage('pong.private_match.leave')
  async receivePrivateMatchLeave(@ConnectedSocket() client: Socket) {
    const user = getUserFromClient(client);

    this.pendingPrivateMatches.leavePrivateMatch(user.id);
  }

  @SubscribeMessage('pong.match_making.entry')
  async receiveMatchMakingEntry(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongMatchMakingEntryDTO
  ) {
    const user = getUserFromClient(client);
    const queue = this.waitingQueues.getQueue(data.matchType);

    if (this.validateUser(user.id) === false || !queue)
      return { status: 'rejected' };

    // 待機キューにユーザーを追加する
    queue.append(user.id);
    return { status: 'accepted' };
  }

  @SubscribeMessage('pong.match_making.leave')
  async receiveMatchMakingLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongMatchMakingLeaveDTO
  ) {
    const user = getUserFromClient(client);

    // 待機キューからユーザーを削除する
    const queue = this.waitingQueues.getQueueByPlayerId(user.id);
    queue?.remove(user.id);
  }

  @SubscribeMessage('pong.match.action')
  async receivePlayerAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerAction: PongMatchActionDTO
  ) {
    console.log('pong.match.action');
    const user = getUserFromClient(client);

    this.ongoingMatches.moveBar(user.id, playerAction);
  }

  // マッチを観戦する
  @SubscribeMessage('pong.match.spectation')
  async receiveMatchSpectation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PongMatchSpectationDTO
  ) {
    const user = getUserFromClient(client);
    const matchId = data.matchId;

    if (!matchId) {
      return;
    }

    const match = this.ongoingMatches.findMatchByMatchId(matchId);
    match?.joinAsSpectator(user.id);
  }
}
