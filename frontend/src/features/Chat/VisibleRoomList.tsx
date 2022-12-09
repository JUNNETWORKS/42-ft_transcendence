import { useAtom } from 'jotai';
import { useEffect, useId, useState } from 'react';

import { FTH3 } from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';
import { useVerticalScrollAttr } from '@/hooks/useVerticalScrollAttr';
import { chatSocketAtom } from '@/stores/auth';
import { useUpdateVisibleRooms } from '@/stores/structure';
import * as TD from '@/typedef';
import { last } from '@/utils';

import { VisibleRoomItem } from './components/VisibleRoomItem';

export const VisibleRoomList = (props: {
  rooms: TD.ChatRoom[];
  isJoiningTo: (roomId: number) => boolean;
  isFocusingTo: (roomId: number) => boolean;
  onJoin: (roomId: number, roomPassword: string, callback: any) => void;
  onFocus: (roomId: number) => void;
}) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [requestKey, setRequestKey] = useState('');
  const listId = useId();
  const scrollData = useVerticalScrollAttr(listId);
  const fetcher = useAPICallerWithCredential();
  const roomUpdator = useUpdateVisibleRooms();
  const oldestItem = last(props.rooms);
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
        {props.rooms.map((room: TD.ChatRoom) => {
          return (
            <VisibleRoomItem
              key={room.id}
              room={room}
              isJoined={props.isJoiningTo(room.id)}
              isFocused={props.isFocusingTo(room.id)}
              onJoin={props.onJoin}
              onFocus={props.onFocus}
            />
          );
        })}
      </div>
    </div>
  );
};
