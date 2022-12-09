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

  onDoneRankMatch(match: OnlineMatch): void {
    this.pongService.updateMatchStatus(match.matchID, 'DONE');
    if (match.winnerID && match.loserID) {
      this.pongService.updateRankPoint(match.winnerID, match.loserID);
    }
  }

  onDoneCasualMatch(match: OnlineMatch): void {
    this.pongService.updateMatchStatus(match.matchID, 'DONE');
  }

  onDonePrivateMatch(match: OnlineMatch): void {
    this.pongService.updateMatchStatus(match.matchID, 'DONE');
  }

  // onError

  onErrorRankMatch(match: OnlineMatch): void {
    this.pongService.updateMatchStatus(match.matchID, 'ERROR');
  }

  onErrorCasualMatch(match: OnlineMatch): void {
    this.pongService.updateMatchStatus(match.matchID, 'ERROR');
  }

  onErrorPrivateMatch(match: OnlineMatch): void {
    this.pongService.updateMatchStatus(match.matchID, 'ERROR');
  }
}
