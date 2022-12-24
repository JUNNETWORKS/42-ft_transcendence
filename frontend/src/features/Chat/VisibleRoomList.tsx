import { useAtom } from 'jotai';
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FTH3 } from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';
import { useVerticalScrollAttr } from '@/hooks/useVerticalScrollAttr';
import { chatSocketAtom } from '@/stores/auth';
import { dataAtom, useUpdateVisibleRooms } from '@/stores/structure';
import * as TD from '@/typedef';
import { last } from '@/utils';

import { makeCommand } from './command';
import { VisibleRoomItem } from './components/VisibleRoomItem';
import { useFocusedChatRoomId } from './hooks/useFocusedRoomId';

export const VisibleRoomList = () => {
  const navigate = useNavigate();
  const [rooms] = useAtom(dataAtom.visibleRoomsAtom);
  const [joiningRooms] = useAtom(dataAtom.joiningRoomsAtom);
  const focusedRoomId = useFocusedChatRoomId();
  const [messagesInRoom] = useAtom(dataAtom.messagesInRoomAtom);
  const [membersInRoom] = useAtom(dataAtom.membersInRoomAtom);
  const [mySocket] = useAtom(chatSocketAtom);
  const [requestKey, setRequestKey] = useState('');
  const listId = useId();
  const scrollData = useVerticalScrollAttr(listId);
  const fetcher = useAPICallerWithCredential();
  const roomUpdator = useUpdateVisibleRooms();
  const oldestItem = last(rooms);

  const command = makeCommand(mySocket!, focusedRoomId);
  const store = {
    roomMessages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
    roomMembers: (roomId: number) => {
      const ms = membersInRoom[roomId];
      if (!ms) {
        return null;
      }
      return ms;
    },
  };

  const action = {
    /**
     * 実態はステート更新関数.
     * レンダリング後に副作用フックでコマンドが走る.
     */
    get_room_members: (roomId: number) => {
      if (roomId > 0) {
        const mems = store.roomMembers(roomId);
        if (!mems) {
          command.get_room_members(roomId);
        }
      }
    },
  };
  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRooms.find((r) => r.chatRoom.id === roomId),
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => focusedRoomId > 0,
  };

  const onFocus = (roomId: number) => {
    if (predicate.isJoiningTo(roomId)) {
      navigate(`/chat/${roomId}`);
      action.get_room_members(roomId);
    }
  };
  useEffect(() => {
    if (Math.abs(scrollData.bottom) >= 1 || scrollData.clientHeight === 0) {
      return;
    }
    if (!mySocket) {
      return;
    }
    const rk = `take=50${oldestItem ? `&cursor=${oldestItem.id}` : ''}`;
    if (rk === requestKey) {
      return;
    }
    setRequestKey(rk);
    fetcher('GET', `/chatrooms?${rk}`)
      .then((response) => {
        if (!response.ok) {
          throw new APIError(response.statusText, response);
        }
        return response.json();
      })
      .then((rooms: TD.ChatRoom[]) => {
        roomUpdator.addMany(rooms);
      })
      .catch((error) => setRequestKey(''));
  }, [
    fetcher,
    listId,
    mySocket,
    oldestItem,
    requestKey,
    roomUpdator,
    scrollData,
  ]);

  return (
    <div className="flex shrink grow flex-col overflow-hidden">
      <div
        id={listId}
        className="flex shrink grow flex-row flex-wrap content-start items-start justify-start overflow-y-auto overflow-x-hidden p-1"
      >
        {rooms.map((room: TD.ChatRoom) => {
          return (
            <VisibleRoomItem
              key={room.id}
              room={room}
              isJoined={predicate.isJoiningTo(room.id)}
              isFocused={predicate.isFocusingTo(room.id)}
              onJoin={command.join}
              onFocus={onFocus}
            />
          );
        })}
      </div>
    </div>
  );
};
