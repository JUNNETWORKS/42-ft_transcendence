import { Injectable } from '@nestjs/common';

import { WsServerGateway } from './../ws-server/ws-server.gateway';

@Injectable()
export class Heartbeat {
  private heartbeatDict: {
    [userId: number]: {
      n: number;
      time: number;
    };
  } = {};

  constructor(private readonly wsServer: WsServerGateway) {}

  incrementHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId] || {
      n: 0,
      time: null,
    };
    r.n += 1;
    r.time = Date.now();
    this.heartbeatDict[userId] = r;
    this.sendHeartbeat(userId);
  }

  updateHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId];
    if (!r) {
      return;
    }
    r.time = Date.now();
    this.heartbeatDict[userId] = r;
    this.sendHeartbeat(userId);
  }

  decrementHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId];
    if (!r) {
      return;
    }
    r.n -= 1;
    if (r.n) {
      this.heartbeatDict[userId] = r;
    } else {
      delete this.heartbeatDict[userId];
      this.sendOffine(userId);
    }
  }

  private sendHeartbeat(userId: number) {
    const r = this.heartbeatDict[userId];
    if (!r) {
      return;
    }
    this.wsServer.sendResults(
      'ft_heartbeat',
      { userId, time: r.time },
      { global: 'global' }
    );
  }

  private sendOffine(userId: number) {
    this.wsServer.sendResults('ft_offline', { userId }, { global: 'global' });
  }
}
