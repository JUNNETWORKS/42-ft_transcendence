import { useAtom } from 'jotai';
import { useEffect, useId, useState } from 'react';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';
import { useVerticalScrollAttr } from '@/hooks/useVerticalScrollAttr';
import { Icons, RoomTypeIcon } from '@/icons';
import { chatSocketAtom } from '@/stores/auth';
import { useUserDataReadOnly } from '@/stores/store';
import { useUpdateVisibleRooms } from '@/stores/structure';
import * as TD from '@/typedef';
import { last } from '@/utils';

import { validateRoomPasswordError } from './components/RoomPassword.validator';
import { RoomPasswordInput } from './components/RoomPasswordInput';

const ListItem = (props: {
  room: TD.ChatRoom;
  isJoined: boolean;
  isFocused: boolean;
  onJoin: (roomId: number, roomPassword: string, callback: any) => void;
  onFocus: (roomId: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [joinError, setJoinError] = useState('');
  const owner = useUserDataReadOnly(props.room.ownerId);
  const TypeIcon = RoomTypeIcon[props.room.roomType];
  if (!owner) {
    return null;
  }

  const onJoin = () => {
    if (props.room.roomType === 'LOCKED' && !isOpen) {
      setIsOpen(true);
    } else {
      props.onJoin(props.room.id, roomPassword, (response: any) => {
        if (response.status !== 'success') {
          setJoinError(validateRoomPasswordError(response.status));
        } else {
          setIsOpen(false);
          setRoomPassword('');
          setJoinError('');
        }
      });
    }
  };
  const closeModal = () => setIsOpen(false);
  const Button = () => {
    if (props.isJoined) {
      return (
        <FTButton
          className="w-[4em] border-white bg-white text-black hover:bg-black hover:text-white"
          onClick={() => props.onFocus(props.room.id)}
        >
          View
        </FTButton>
      );
    } else {
      return (
        <FTButton className="w-[4em] text-white" onClick={() => onJoin()}>
          Join
        </FTButton>
      );
    }
  };
  return (
    <>
      <Modal isOpen={isOpen} closeModal={closeModal}>
        <RoomPasswordInput
          roomPassword={roomPassword}
          setRoomPassword={setRoomPassword}
          joinError={joinError}
          onJoin={onJoin}
          onClose={closeModal}
        />
      </Modal>
      <div
        className={`m-2 flex basis-[16em] flex-col overflow-hidden border-2 border-solid ${
          props.isJoined ? 'border-gray-100' : 'border-gray-600 text-gray-400'
        } p-1 hover:border-gray-100 hover:bg-gray-800 hover:text-white`}
        key={props.room.id}
      >
        <div className={`flex min-w-0 flex-row items-center`}>
          <div className="shrink-0 grow-0">
            <InlineIcon i={<TypeIcon />} />
          </div>
          <div
            className="shrink grow overflow-hidden text-ellipsis text-xl"
            title={props.room.roomName}
          >
            {props.room.roomName}
          </div>
        </div>
        <div className="flex shrink grow flex-row items-center p-[2px]">
          <InlineIcon className="p-0" i={<Icons.Chat.Owner />} />
          <div
            className={`shrink grow overflow-hidden text-ellipsis text-left text-sm`}
            style={{ wordBreak: 'keep-all' }}
            title={owner.displayName}
          >
            {owner.displayName}
          </div>

          <div className="shrink-0 grow-0">
            <Button />
          </div>
        </div>
      </div>
    </>
  );
};

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
  }, [fetcher, mySocket, oldestItem, requestKey, roomUpdator, scrollData]);

  return (
    <div className="flex flex-col overflow-hidden">
      <FTH3 className="shrink-0 grow-0">Chatrooms</FTH3>
      <div
        id={listId}
        className="flex shrink grow flex-row flex-wrap overflow-y-auto overflow-x-hidden p-1"
      >
        {props.rooms.map((room: TD.ChatRoom) => {
          return (
            <ListItem
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
