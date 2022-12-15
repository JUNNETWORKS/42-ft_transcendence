import { Injectable } from '@nestjs/common';
import { MatchType } from '@prisma/client';

import { PongService } from '../pong.service';
import { OnlineMatch } from './online-match';

type onDoneType = (match: OnlineMatch) => void;
type onErrorType = (match: OnlineMatch) => void;

@Injectable()
export class PostMatchStrategy {
  constructor(private readonly pongService: PongService) {}

  getOnDone(matchType: MatchType): onDoneType {
    switch (matchType) {
      case 'RANK':
        return (match: OnlineMatch) => this.onDoneRankMatch(match);
      case 'CASUAL':
        return (match: OnlineMatch) => this.onDoneCasualMatch(match);
      case 'PRIVATE':
        return (match: OnlineMatch) => this.onDonePrivateMatch(match);
    }
  }

  getOnError(matchType: MatchType): onErrorType {
    switch (matchType) {
      case 'RANK':
        return (match: OnlineMatch) => this.onErrorRankMatch(match);
      case 'CASUAL':
        return (match: OnlineMatch) => this.onErrorCasualMatch(match);
      case 'PRIVATE':
        return (match: OnlineMatch) => this.onErrorPrivateMatch(match);
    }
  }

  // onDone

  private onDoneRankMatch(match: OnlineMatch): void {
    this.pongService.updateMatchAsDone(match);
    if (match.winnerId && match.loserId) {
      this.pongService.updateRankPoint(match.winnerId, match.loserId);
    }
  }

  private onDoneCasualMatch(match: OnlineMatch): void {
    this.pongService.updateMatchAsDone(match);
  }

  private onDonePrivateMatch(match: OnlineMatch): void {
    this.pongService.updateMatchAsDone(match);
  }

  // onError

  private onErrorRankMatch(match: OnlineMatch): void {
    this.pongService.updateMatchAsError(match);
  }

  private onErrorCasualMatch(match: OnlineMatch): void {
    this.pongService.updateMatchAsError(match);
  }

  private onErrorPrivateMatch(match: OnlineMatch): void {
    this.pongService.updateMatchAsError(match);
  }
}
