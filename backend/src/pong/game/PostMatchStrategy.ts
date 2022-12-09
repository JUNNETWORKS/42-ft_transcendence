import { Injectable } from '@nestjs/common';
import { MatchType } from '@prisma/client';

import { PongService } from '../pong.service';
import { OnlineMatch } from './online-match';

type onFinishType = (match: OnlineMatch) => void;

@Injectable()
export class PostMatchStrategy {
  constructor(private readonly pongService: PongService) {}

  getOnFinish(matchType: MatchType): onFinishType {
    switch (matchType) {
      case 'RANK':
        return (match: OnlineMatch) => this.onFinishRankMatch(match);
      case 'CASUAL':
        return (match: OnlineMatch) => this.onFinishCasualMatch(match);
      case 'PRIVATE':
        return (match: OnlineMatch) => this.onFinishPrivateMatch(match);
    }
  }

  onFinishRankMatch(match: OnlineMatch): void {
    this.pongService.createMatch(match);
    if (match.winnerID && match.loserID) {
      this.pongService.updateRankPoint(match.winnerID, match.loserID);
    }
  }

  onFinishCasualMatch(match: OnlineMatch): void {
    this.pongService.createMatch(match);
  }

  onFinishPrivateMatch(match: OnlineMatch): void {
    this.pongService.createMatch(match);
  }
}
