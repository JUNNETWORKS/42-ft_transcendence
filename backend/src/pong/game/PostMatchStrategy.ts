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
    this.pongService.createMatchResult(match);
    // TODO: ランク計算処理
  }

  onFinishCasualMatch(match: OnlineMatch): void {
    this.pongService.createMatchResult(match);
  }

  onFinishPrivateMatch(match: OnlineMatch): void {
    this.pongService.createMatchResult(match);
  }
}
