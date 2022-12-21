import { MatchType } from '@prisma/client';

import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { Match } from './match';
import { PostMatchStrategy } from './PostMatchStrategy';
import { MatchResult, PlayerInput } from './types/game-state';

type FactoryProps = {
  wsServer: WsServerGateway;
  userId1: number;
  userId2: number;
  matchType: MatchType;
  removeFn: (matchId: string) => void;
  postMatchStrategy: PostMatchStrategy;
  matchId: string;
  config?: { maxScore: number; speed: number };
};

// このクラスは以下に対して責任を持つ
// - マッチの保持
// - マッチのWSルームを作成
// - setInterval() で作成されるTimerIdの保持
export class OnlineMatch {
  // マッチId
  private readonly Id: string;
  private readonly match: Match;
  private readonly wsServer: WsServerGateway;
  private gameStateSyncTimer: NodeJS.Timer;

  public readonly matchType: MatchType;

  private constructor(
    wsServer: WsServerGateway,
    matchId: string,
    userId1: number,
    userId2: number,
    matchType: MatchType,
    match: Match,
    private readonly removeFromOngoingMatches: (matchId: string) => void,
    private readonly postMatchStrategy: PostMatchStrategy
  ) {
    this.wsServer = wsServer;
    this.postMatchStrategy = postMatchStrategy;
    this.Id = matchId;
    this.matchType = matchType;
    this.match = match;
    this.joinAsSpectator(userId1);
    this.joinAsSpectator(userId2);
  }

  static create({
    wsServer,
    userId1,
    userId2,
    matchType,
    removeFn,
    postMatchStrategy,
    matchId,
    config,
  }: FactoryProps) {
    return new OnlineMatch(
      wsServer,
      matchId,
      userId1,
      userId2,
      matchType,
      new Match(userId1, userId2, config),
      removeFn,
      postMatchStrategy
    );
  }

  start() {
    this.gameStateSyncTimer = setInterval(async () => {
      this.match.update();

      if (this.wsServer) {
        this.wsServer.sendResults('pong.match.state', this.match.getState(), {
          matchId: this.Id,
        });

        if (this.match.winner !== 'none') {
          const loserSide = this.match.winner === 'right' ? 'left' : 'right';
          const result: MatchResult = {
            winner: this.match.players[Match.sideIndex[this.match.winner]],
            loser: this.match.players[Match.sideIndex[loserSide]],
          };
          await this.wsServer.sendResults(
            'pong.match.finish',
            {
              game: this.match.getState(),
              result,
            },
            { matchId: this.Id }
          );
          this.close();
          this.removeFromOngoingMatches(this.Id);
          this.wsServer.leaveAllSocket({ matchId: this.Id });
          this.postMatchStrategy.getOnDone(this.matchType)(this);
        }
      }
    }, 16.66); // 60fps
  }

  // マッチのWSルームに観戦者として参加｡
  // プレイヤーもゲーム状態を受け取るためにこの関数を呼ぶ｡
  joinAsSpectator(userId: number) {
    this.wsServer.usersJoin(userId, { matchId: this.Id });
  }

  // ユーザーが退出した際の処理
  leave(userId: number) {
    if (userId in this.match.players) {
      // TODO: ユーザーがプレイヤーだった場合ゲームを終了させる
    }
    this.wsServer.usersLeave(userId, { matchId: this.Id });
  }

  // バーを動かす｡プレイヤーとして認識されていない場合は何もしない｡
  moveBar(playerId: number, playerAction: PlayerInput) {
    this.match.moveBar(playerId, playerAction);
  }

  // ゲームを終了
  close() {
    clearInterval(this.gameStateSyncTimer);
  }

  // ゲームの状態更新し､Roomに送信
  syncGameState() {
    if (this.match === undefined) {
      // インスタンスが作られる前に gameStateSyncTimer が呼ばれることがあるのでガードを入れておく｡
      return;
    }

    this.match.update();

    if (this.wsServer) {
      this.wsServer.sendResults('pong.match.state', this.match.getState(), {
        matchId: this.Id,
      });

      if (this.match.winner !== 'none') {
        const loserSide = this.match.winner === 'right' ? 'left' : 'right';
        const result: MatchResult = {
          winner: this.match.players[Match.sideIndex[this.match.winner]],
          loser: this.match.players[Match.sideIndex[loserSide]],
        };
        this.wsServer.sendResults('pong.match.finish', result, {
          matchId: this.Id,
        });
        this.close();
      }
    }
  }

  get matchId() {
    return this.Id;
  }

  get playerIds() {
    return [this.match.players[0].id, this.match.players[1].id];
  }

  get playerId1() {
    return this.match.players[0].id;
  }

  set playerId1(userId: number) {
    this.match.players[0].id = userId;
  }

  get playerId2() {
    return this.match.players[1].id;
  }

  set playerId2(userId: number) {
    this.match.players[1].id = userId;
  }

  get playerScores() {
    return [this.match.players[0].score, this.match.players[1].score];
  }

  get playerScore1() {
    return this.match.players[0].score;
  }

  get playerScore2() {
    return this.match.players[1].score;
  }

  get winnerId() {
    if (this.match.winner === 'none') {
      return undefined;
    }
    return this.match.players[Match.sideIndex[this.match.winner]].id;
  }

  get loserId() {
    if (this.match.winner === 'none') {
      return undefined;
    }
    const loserSide = this.match.winner === 'right' ? 'left' : 'right';
    return this.match.players[Match.sideIndex[loserSide]].id;
  }
}
