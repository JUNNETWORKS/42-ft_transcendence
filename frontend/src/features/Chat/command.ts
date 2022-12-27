import { io } from 'socket.io-client';

import * as TD from '@/typedef';
import { isfinite } from '@/utils';

import { MatchConfig } from '../User/types/MatchResult';

export function makeCommand(
  mySocket: ReturnType<typeof io>,
  focusedRoomId: number
) {
  return {
    join: (roomId: number, roomPassword: string, callback: any) => {
      const data = {
        roomId,
        roomPassword,
      };
      console.log(data);
      mySocket.emit('ft_join', data, (response: any) => {
        callback(response);
      });
    },

    leave: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(data);
      mySocket.emit('ft_leave', data);
    },

    say: (content: string) => {
      if (!isfinite(focusedRoomId)) {
        return;
      }
      const data = {
        roomId: focusedRoomId,
        content,
      };
      console.log(data);
      mySocket.emit('ft_say', data);
    },

    get_room_messages: (roomId: number, take: number, cursor?: number) => {
      const data = {
        roomId,
        take,
        cursor,
      };
      console.log(['get_room_messages'], data);
      mySocket.emit('ft_get_room_messages', data);
    },

    get_room_members: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(['get_room_members'], data);
      mySocket.emit('ft_get_room_members', data);
    },

    nomminate: (member: TD.ChatUserRelation) => {
      console.log('[nomminate]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket.emit('ft_nomminate', data);
    },

    ban: (member: TD.ChatUserRelation) => {
      console.log('[ban]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket.emit('ft_ban', data);
    },

    kick: (member: TD.ChatUserRelation) => {
      console.log('[kick]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket.emit('ft_kick', data);
    },

    mute: (member: TD.ChatUserRelation) => {
      console.log('[mute]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket.emit('ft_mute', data);
    },

    pong_private_match_create: (roomId: number, config: MatchConfig) => {
      console.log('[pong.private_match.create]', roomId);
      const data = {
        roomId,
        ...config,
      };
      return new Promise<any>((res, rej) => {
        mySocket.emit('pong.private_match.create', data, (result: any) => {
          if (result && result.status === 'accepted') {
            res(result);
            return;
          }
          rej(result);
        });
      });
    },

    pong_private_match_cancel: (matchId: string) => {
      console.log('[pong.private_match.leave]', matchId);
      const data = {
        matchId,
      };
      return new Promise<any>((res, rej) => {
        mySocket.emit('pong.private_match.leave', data, (result: any) => {
          if (result && result.status === 'accepted') {
            res(result);
            return;
          }
          rej(result);
        });
      });
    },

    pong_private_match_join: (matchId: string) => {
      console.log('[pong.private_match.join]', matchId);
      const data = {
        matchId,
      };
      return new Promise<any>((res, rej) => {
        mySocket.emit('pong.private_match.join', data, (result: any) => {
          if (result && result.status === 'accepted') {
            res(result);
            return;
          }
          rej(result);
        });
      });
    },

    pong_spectate_match: (matchId: string) => {
      console.log('[pong.match.spectation]', matchId);
      const data = {
        matchId,
      };
      mySocket.emit('pong.match.spectation', data);
    },
  };
}
