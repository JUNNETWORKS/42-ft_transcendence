import { authAtom, chatSocketAtom } from '@/atoms/auth';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import * as TD from '../typedef';
import * as Utils from '@/utils';
import { useUpdateUser } from '@/atoms/store';
import { structureAtom } from '@/atoms/structure';

export const SocketHolder = () => {
  // 「ソケット」
  // 認証されていない場合はnull
  const [mySocket] = useAtom(chatSocketAtom);

  // 認証フローのチェックと状態遷移
  const [personalData] = useAtom(authAtom.personalData);
  const setVisibleRooms = useSetAtom(structureAtom.visibleRoomsAtom);
  const setJoiningRooms = useSetAtom(structureAtom.joiningRoomsAtom);
  const [friends, setFriends] = useAtom(structureAtom.friends);
  const setFocusedRoomId = useSetAtom(structureAtom.focusedRoomIdAtom);
  const setMessagesInRoom = useSetAtom(structureAtom.messagesInRoomAtom);
  const setMembersInRoom = useSetAtom(structureAtom.membersInRoomAtom);
  const userId = personalData ? personalData.id : -1;

  const userUpdator = useUpdateUser();

  useEffect(() => {
    console.log('mySocket?', !!mySocket);
    mySocket?.on('ft_connection', (data: TD.ConnectionResult) => {
      console.log('catch connection', data);
      setJoiningRooms(data.joiningRooms);
      setVisibleRooms(data.visibleRooms);
      setFriends(data.friends);
      userUpdator.addMany(data.friends);
    });

    mySocket?.on('ft_heartbeat', (data: TD.HeartbeatResult) => {
      console.log('catch heartbeat', data);
      userUpdator.updateOne(data.userId, { time: data.time });
    });

    mySocket?.on('ft_offline', (data: TD.HeartbeatResult) => {
      console.log('catch offline', data);
      userUpdator.offlinate(data.userId);
    });

    mySocket?.on('ft_open', (data: TD.OpenResult) => {
      console.log('catch open');
      console.log(data);
      const room: TD.ChatRoom = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setVisibleRooms((prev) => {
        const next = [...prev];
        next.push(room);
        return next;
      });
      if (room.ownerId === userId) {
        setJoiningRooms((prev) => {
          const next = [...prev];
          next.push(room);
          return next;
        });
      }
    });

    mySocket?.on('ft_say', (data: TD.SayResult) => {
      const message = TD.Mapper.chatRoomMessage(data);
      console.log('catch say');
      const roomId = data.chatRoomId;
      stateMutater.addMessagesToRoom(roomId, [message]);
    });

    mySocket?.on('ft_join', (data: TD.JoinResult) => {
      console.log('catch join', data);
      if (!(userId > 0)) {
        return;
      }
      const { chatRoom: room } = data.relation;
      const user = data.user;
      console.log(room, user);
      if (user.id === userId) {
        // 自分に関する通知
        console.log('for self');
        setJoiningRooms((prev) => {
          const sameRoom = prev.find((r) => r.id === room.id);
          if (sameRoom) {
            return prev;
          }
          const newRoomList = [...prev];
          newRoomList.push(room);
          return newRoomList;
        });
      } else {
        // 他人に関する通知
        console.log('for other');
        stateMutater.mergeMembersInRoom(room.id, { [user.id]: data.relation });
      }
    });

    mySocket?.on('ft_leave', (data: TD.LeaveResult) => {
      console.log('catch leave', data);
      if (!(userId > 0)) {
        return;
      }
      const { chatRoom: room } = data.relation;
      const user = data.user;
      console.log(room, user);
      if (user.id === userId) {
        // 自分に関する通知
        console.log('for self');
        setJoiningRooms((prev) => {
          stateMutater.unfocusRoom();
          const newRoomList = prev.filter((r) => r.id !== room.id);
          if (newRoomList.length === prev.length) {
            return prev;
          }
          return newRoomList;
        });
      } else {
        // 他人に関する通知
        console.log('for other');
        stateMutater.removeMembersInRoom(room.id, user.id);
      }
    });

    mySocket?.on('ft_kick', (data: TD.LeaveResult) => {
      console.log('catch kick', data);
      if (!(userId > 0)) {
        return;
      }
      const { room, user } = data;
      console.log(room, user);
      if (user.id === userId) {
        // 自分に関する通知
        console.log('for self');
        setJoiningRooms((prev) => {
          stateMutater.unfocusRoom();
          const newRoomList = prev.filter((r) => r.id !== room.id);
          if (newRoomList.length === prev.length) {
            return prev;
          }
          return newRoomList;
        });
      } else {
        // 他人に関する通知
        console.log('for other');
        stateMutater.removeMembersInRoom(room.id, user.id);
      }
    });

    mySocket?.on('ft_nomminate', (data: TD.NomminateResult) => {
      console.log('catch nomminate', data);
      if (!(userId > 0)) {
        return;
      }
      const { relation, room, user } = data;
      console.log(relation, room, user);
      stateMutater.mergeMembersInRoom(room.id, { [user.id]: relation });
    });

    mySocket?.on('ft_get_room_messages', (data: TD.GetRoomMessagesResult) => {
      console.log('catch get_room_messages');
      const { id, messages } = data;
      console.log(id, !!messages);
      stateMutater.addMessagesToRoom(
        id,
        messages.map(TD.Mapper.chatRoomMessage)
      );
    });

    mySocket?.on('ft_get_room_members', (data: TD.GetRoomMembersResult) => {
      console.log('catch get_room_members');
      const { id, members } = data;
      console.log(id, members);
      stateMutater.mergeMembersInRoom(
        id,
        Utils.keyBy(members, (a) => `${a.userId}`)
      );
    });

    mySocket?.on('ft_follow', (data: TD.FollowResult) => {
      console.log('catch follow');
      if (!friends.find((f) => f.id === data.user.id)) {
        setFriends((prev) => {
          const next = [...prev, data.user];
          return next;
        });
      }
    });

    mySocket?.on('ft_unfollow', (data: TD.FollowResult) => {
      console.log('catch unfollow');
      if (friends.find((f) => f.id === data.user.id)) {
        setFriends((prev) => {
          const next = prev.filter((f) => f.id !== data.user.id);
          return next;
        });
      }
    });

    return () => {
      mySocket?.removeAllListeners();
    };
  });

  /**
   * ステート変更処理のラッパ
   */
  const stateMutater = {
    // 指定したルームにフォーカス(フロントエンドで中身を表示)する
    focusRoom: (roomId: number) => {
      setFocusedRoomId(roomId);
    },

    // ルームへのフォーカスをやめる
    unfocusRoom: () => setFocusedRoomId(-1),

    // チャットルームにメッセージを追加する
    // (メッセージは投稿時刻の昇順になる)
    addMessagesToRoom: (roomId: number, newMessages: TD.ChatRoomMessage[]) => {
      setMessagesInRoom((prev) => {
        const next: { [roomId: number]: TD.ChatRoomMessage[] } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = [...prev[key]];
        });
        if (!next[roomId]) {
          next[roomId] = [];
        }
        const messages = next[roomId];
        messages.push(...newMessages);
        next[roomId] = Utils.sortBy(
          Utils.uniqBy(messages, (m) => m.id),
          (m) => m.createdAt
        );
        return next;
      });
    },

    /**
     * チャットルームにメンバーをマージする
     * @param roomId
     * @param newMembers
     */
    mergeMembersInRoom: (roomId: number, newMembers: TD.UserRelationMap) => {
      console.log(`mergeMembersInRoom(${roomId}, ${newMembers})`);
      setMembersInRoom((prev) => {
        console.log(`mergeMembersInRoom -> setMembersInRoom`);
        const next: { [roomId: number]: TD.UserRelationMap } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = prev[key] ? { ...prev[key] } : {};
        });
        if (!next[roomId]) {
          next[roomId] = {};
        }
        const members = next[roomId];
        Utils.keys(newMembers).forEach((key) => {
          members[key] = newMembers[key];
        });
        console.log('[newMembers]', newMembers);
        console.log('[prev]', prev);
        console.log('[next]', next);
        return next;
      });
    },

    removeMembersInRoom: (roomId: number, userId: number) => {
      console.log(`removeMembersInRoom(${roomId}, ${userId})`);
      setMembersInRoom((prev) => {
        console.log(`removeMembersInRoom -> setMembersInRoom`);
        const next: { [roomId: number]: TD.UserRelationMap } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = prev[key] ? { ...prev[key] } : {};
        });
        const members = next[roomId];
        if (!members) {
          return next;
        }
        console.log('removing member', userId, 'from', members);
        delete members[userId];
        console.log('members', members);
        console.log(prev, next);
        return next;
      });
    },
  };

  return <></>;
};
