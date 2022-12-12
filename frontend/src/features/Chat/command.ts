import { io } from 'socket.io-client';

import * as TD from '@/typedef';
import { isfinite } from '@/utils';

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

    pong_private_match_create: (roomId: number) => {
      console.log('[pong.private_match.create]', roomId);
      const data = {
        roomId,
      };
      mySocket.emit('pong.private_match.create', data);
    },
  };
}
