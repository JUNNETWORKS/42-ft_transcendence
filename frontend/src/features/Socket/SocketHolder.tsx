import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { authAtom, chatSocketAtom } from '@/stores/auth';
import { useUpdateRoom, useUpdateUser, useUpdateDmRoom } from '@/stores/store';
import { structureAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import * as Utils from '@/utils';

export const SocketHolder = () => {
  // 「ソケット」
  // 認証されていない場合はnull
  const [mySocket] = useAtom(chatSocketAtom);

  // 認証フローのチェックと状態遷移
  const [personalData] = useAtom(authAtom.personalData);
  const [, setVisibleRooms] = useAtom(structureAtom.visibleRoomsAtom);
  const [, setJoiningRooms] = useAtom(structureAtom.joiningRoomsAtom);
  const [, setDmRooms] = useAtom(structureAtom.dmRoomsAtom);
  const [friends, setFriends] = useAtom(structureAtom.friends);
  const [blockingUsers, setBlockingUsers] = useAtom(
    structureAtom.blockingUsers
  );
  const [, setFocusedRoomId] = useAtom(structureAtom.focusedRoomIdAtom);
  const [, setMessagesInRoom] = useAtom(structureAtom.messagesInRoomAtom);
  const [, setMembersInRoom] = useAtom(structureAtom.membersInRoomAtom);
  const userId = personalData ? personalData.id : -1;

  const userUpdator = useUpdateUser();
  const roomUpdator = useUpdateRoom();
  const dmRoomUpdator = useUpdateDmRoom();

  useEffect(() => {
    console.log('mySocket?', !!mySocket);
    mySocket?.on('ft_connection', (data: TD.ConnectionResult) => {
      console.log('catch connection', data);
      setJoiningRooms(data.joiningRooms);
      setVisibleRooms(data.visibleRooms);
      setDmRooms(data.dmRooms);
      setFriends(data.friends);
      setBlockingUsers(data.blockingUsers);
      userUpdator.addMany(data.friends);
      userUpdator.addMany(data.blockingUsers);
      roomUpdator.addMany(data.visibleRooms);
      roomUpdator.addMany(data.joiningRooms);
      dmRoomUpdator.addMany(data.dmRooms);
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
      roomUpdator.addOne(room);
    });

    mySocket?.on('ft_tell', (data: TD.DmOpenResult) => {
      console.log('catch dm_open');
      console.log(data);
      const room: TD.DmRoom = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setDmRooms((prev) => {
        const next = [...prev];
        next.push(room);
        return next;
      });
      dmRoomUpdator.addOne(room);
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
        userUpdator.addOne(data.relation.user);
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
      userUpdator.addMany(messages.map((m) => m.user));
      stateMutater.addMessagesToRoom(
        id,
        messages.map(TD.Mapper.chatRoomMessage)
      );
    });

    mySocket?.on('ft_get_room_members', (data: TD.GetRoomMembersResult) => {
      console.log('catch get_room_members');
      const { id, members } = data;
      console.log(id, members);
      userUpdator.addMany(members.map((m) => m.user));
      stateMutater.mergeMembersInRoom(
        id,
        Utils.keyBy(members, (a) => `${a.userId}`)
      );
    });

    mySocket?.on('ft_follow', (data: TD.FollowResult) => {
      console.log('catch follow');
      if (!friends.find((f) => f.id === data.user.id)) {
        userUpdator.addOne(data.user);
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

    mySocket?.on('ft_block', (data: TD.BlockResult) => {
      console.log('catch block');
      if (!blockingUsers.find((f) => f.id === data.user.id)) {
        setBlockingUsers((prev) => {
          const next = [...prev, data.user];
          return next;
        });
      }
    });

    mySocket?.on('ft_unblock', (data: TD.UnblockResult) => {
      console.log('catch unblock');
      if (blockingUsers.find((f) => f.id === data.user.id)) {
        setBlockingUsers((prev) => {
          const next = prev.filter((f) => f.id !== data.user.id);
          return next;
        });
      }
    });

    mySocket?.on('ft_user', (data: TD.UserResult) => {
      console.log('catch user', data);
      switch (data.action) {
        case 'update':
          userUpdator.updateOne(data.id, data.data);
          break;
        case 'delete':
          userUpdator.delOne(data.id);
          break;
      }
    });

    mySocket?.on('ft_chatroom', (data: TD.ChatRoomResult) => {
      console.log('catch chatroom', data);
      switch (data.action) {
        case 'update':
          roomUpdator.updateOne(data.id, data.data);
          break;
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
      setMembersInRoom((prev) => {
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
        return next;
      });
    },

    removeMembersInRoom: (roomId: number, userId: number) => {
      setMembersInRoom((prev) => {
        const next: { [roomId: number]: TD.UserRelationMap } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = prev[key] ? { ...prev[key] } : {};
        });
        const members = next[roomId];
        if (!members) {
          return next;
        }
        delete members[userId];
        return next;
      });
    },
  };

  return null;
};
