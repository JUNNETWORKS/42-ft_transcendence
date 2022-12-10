import { useAtom } from 'jotai';
import { useEffect, useId, useState } from 'react';

import { FTH3 } from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';
import { useVerticalScrollAttr } from '@/hooks/useVerticalScrollAttr';
import { chatSocketAtom } from '@/stores/auth';
import {
  dataAtom,
  structureAtom,
  useUpdateVisibleRooms,
} from '@/stores/structure';
import * as TD from '@/typedef';
import { last } from '@/utils';

import { makeCommand } from './command';
import { VisibleRoomItem } from './components/VisibleRoomItem';

export const VisibleRoomList = () => {
  const [rooms] = useAtom(dataAtom.visibleRoomsAtom);
  const [joiningRooms] = useAtom(dataAtom.joiningRoomsAtom);
  const [focusedRoomId, setFocusedRoomId] = useAtom(
    structureAtom.focusedRoomIdAtom
  );
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
    countMessages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms) {
        return undefined;
      }
      return ms.length;
    },
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
      setFocusedRoomId(roomId);
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
      <FTH3 className="shrink-0 grow-0">Chatrooms</FTH3>
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
