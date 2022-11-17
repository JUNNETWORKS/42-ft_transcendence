import { io } from 'socket.io-client';
import * as TD from '@/typedef';

export function makeCommands(mySocket: ReturnType<typeof io>) {
  return {
    entryMatchMaking: (queueID: string) => {
      mySocket.emit('pong.match_making.entry', { queueID });
    },
    leaveMatchMaking: () => {
      mySocket.emit('pong.match_making.leave', {});
    },
  };
}
