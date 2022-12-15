import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { authAtom, chatSocketAtom } from '@/stores/auth';
import { useUpdateRoom, useUpdateUser, useUpdateDmRoom } from '@/stores/store';
import {
  structureAtom,
  useUpdateJoiningRooms,
  useUpdateVisibleRooms,
} from '@/stores/structure';
import * as TD from '@/typedef';
import * as Utils from '@/utils';

export const SocketHolder = () => {
  // 「ソケット」
  // 認証されていない場合はnull
  const [mySocket] = useAtom(chatSocketAtom);
  const navigate = useNavigate();

  // 認証フローのチェックと状態遷移
  const [personalData] = useAtom(authAtom.personalData);
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
  const visibleRoomsUpdater = useUpdateVisibleRooms();
  const joiningRoomsUpdater = useUpdateJoiningRooms();

  useEffect(() => {
    if (!mySocket) {
      return;
    }

    type PS = Parameters<typeof mySocket.on>;

    const listeners: [PS[0], PS[1]][] = [];

    listeners.push([
      'ft_connection',
      (data: TD.ConnectionResult) => {
        console.log('catch connection', data);
        joiningRoomsUpdater.addMany(data.joiningRooms);
        visibleRoomsUpdater.addMany(data.visibleRooms);
        setDmRooms(data.dmRooms);
        setFriends(data.friends);
        setBlockingUsers(data.blockingUsers);
        userUpdator.addMany(data.friends);
        userUpdator.addMany(data.blockingUsers);
        userUpdator.addMany(
          Utils.compact(data.visibleRooms.map((r) => r.owner))
        );
        userUpdator.addMany(
          Utils.compact(data.joiningRooms.map((r) => r.chatRoom.owner))
        );
        dmRoomUpdator.addMany(data.dmRooms);
      },
    ]);

    listeners.push([
      'ft_heartbeat',
      (data: TD.HeartbeatResult) => {
        console.log('catch heartbeat', data);
        userUpdator.updateOne(data.userId, { time: data.time });
      },
    ]);

    listeners.push([
      'ft_offline',
      (data: TD.HeartbeatResult) => {
        console.log('catch offline', data);
        userUpdator.offlinate(data.userId);
      },
    ]);

    listeners.push([
      'ft_open',
      (data: TD.OpenResult) => {
        console.log('catch open');
        console.log(data);
        const room: TD.ChatRoom = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        visibleRoomsUpdater.addOne(room);
        if (room.ownerId === userId) {
          joiningRoomsUpdater.addOne({
            chatRoom: room,
            createdAt: room.createdAt,
          });
        }
        roomUpdator.addOne(room);
        if (room.owner) {
          userUpdator.addOne(room.owner);
        }
      },
    ]);

    listeners.push([
      'ft_tell',
      (data: TD.DmOpenResult) => {
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
      },
    ]);

    listeners.push([
      'ft_say',
      (data: TD.SayResult) => {
        const message = TD.Mapper.chatRoomMessage(data);
        console.log('catch say', data);
        const roomId = data.chatRoomId;
        stateMutater.addMessagesToRoom(roomId, [message]);
      },
    ]);

    listeners.push([
      'ft_join',
      (data: TD.JoinResult) => {
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
          joiningRoomsUpdater.addOne({ chatRoom: room, createdAt: new Date() });
        } else {
          // 他人に関する通知
          console.log('for other');
          userUpdator.addOne(data.relation.user);
          stateMutater.mergeMembersInRoom(room.id, {
            [user.id]: data.relation,
          });
        }
      },
    ]);

    listeners.push([
      'ft_leave',
      (data: TD.LeaveResult) => {
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
          joiningRoomsUpdater.delOne(room);
        } else {
          // 他人に関する通知
          console.log('for other');
          stateMutater.removeMembersInRoom(room.id, user.id);
        }
      },
    ]);

    listeners.push([
      'ft_kick',
      (data: TD.LeaveResult) => {
        console.log('catch kick', data);
        if (!(userId > 0)) {
          return;
        }
        const { room, user } = data;
        console.log(room, user);
        if (user.id === userId) {
          // 自分に関する通知
          console.log('for self');
          joiningRoomsUpdater.delOne(room);
        } else {
          // 他人に関する通知
          console.log('for other');
          stateMutater.removeMembersInRoom(room.id, user.id);
        }
      },
    ]);

    listeners.push([
      'ft_nomminate',
      (data: TD.NomminateResult) => {
        console.log('catch nomminate', data);
        if (!(userId > 0)) {
          return;
        }
        const { relation, room, user } = data;
        console.log(relation, room, user);
        stateMutater.mergeMembersInRoom(room.id, { [user.id]: relation });
      },
    ]);

    listeners.push([
      'ft_get_room_messages',
      (data: TD.GetRoomMessagesResult) => {
        console.log('catch get_room_messages', data);
        const { id, messages } = data;
        console.log(id, !!messages);
        userUpdator.addMany(messages.map((m) => m.user));
        stateMutater.addMessagesToRoom(
          id,
          messages.map(TD.Mapper.chatRoomMessage)
        );
      },
    ]);

    listeners.push([
      'ft_get_room_members',
      (data: TD.GetRoomMembersResult) => {
        console.log('catch get_room_members');
        const { id, members } = data;
        console.log(id, members);
        userUpdator.addMany(members.map((m) => m.user));
        stateMutater.mergeMembersInRoom(
          id,
          Utils.keyBy(members, (a) => `${a.userId}`)
        );
      },
    ]);

    listeners.push([
      'ft_follow',
      (data: TD.FollowResult) => {
        console.log('catch follow');
        if (!friends.find((f) => f.id === data.user.id)) {
          userUpdator.addOne(data.user);
          setFriends((prev) => {
            const next = [...prev, data.user];
            return next;
          });
        }
      },
    ]);

    listeners.push([
      'ft_unfollow',
      (data: TD.FollowResult) => {
        console.log('catch unfollow');
        if (friends.find((f) => f.id === data.user.id)) {
          setFriends((prev) => {
            const next = prev.filter((f) => f.id !== data.user.id);
            return next;
          });
        }
      },
    ]);

    listeners.push([
      'ft_block',
      (data: TD.BlockResult) => {
        console.log('catch block');
        if (!blockingUsers.find((f) => f.id === data.user.id)) {
          setBlockingUsers((prev) => {
            const next = [...prev, data.user];
            return next;
          });
        }
      },
    ]);

    listeners.push([
      'ft_unblock',
      (data: TD.UnblockResult) => {
        console.log('catch unblock');
        if (blockingUsers.find((f) => f.id === data.user.id)) {
          setBlockingUsers((prev) => {
            const next = prev.filter((f) => f.id !== data.user.id);
            return next;
          });
        }
      },
    ]);

    listeners.push([
      'ft_user',
      (data: TD.UserResult) => {
        console.log('catch user', data);
        switch (data.action) {
          case 'update':
            userUpdator.updateOne(data.id, data.data);
            break;
          case 'delete':
            userUpdator.delOne(data.id);
            break;
        }
      },
    ]);

    listeners.push([
      'ft_chatroom',
      (data: TD.ChatRoomResult) => {
        console.log('catch chatroom', data);
        switch (data.action) {
          case 'update':
            roomUpdator.updateOne(data.id, data.data);
            break;
        }
      },
    ]);

    listeners.push([
      'pong.match_making.done',
      (data) => {
        const matchId = data.matchId;
        console.log(`マッチメイキング完了! matchId: ${matchId}`);
        // 対戦ページに遷移する
        navigate(`/pong/matches/${matchId}`);
      },
    ]);

    listeners.push([
      'pong.private_match.created',
      (data) => {
        console.log('[receipt]', data);
      },
    ]);

    listeners.forEach((l) => mySocket.on(...l));

    return () => {
      listeners.forEach((l) => mySocket.off(...l));
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
