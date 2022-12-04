import { useState } from 'react';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { UserAvatar } from '@/components/UserAvater';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { useUserDataReadOnly } from '@/stores/store';
import * as TD from '@/typedef';
import * as Utils from '@/utils';

import { validateRoomPasswordError } from './components/RoomPassword.validator';
import { RoomPasswordInput } from './components/RoomPasswordInput';
import { RoomTypeIcon } from './RoomSetting';

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
    props.onJoin(props.room.id, roomPassword, (response: any) => {
      if (response.status !== 'success') {
        setJoinError(validateRoomPasswordError(response.status));
      } else {
        setIsOpen(false);
        setRoomPassword('');
        setJoinError('');
      }
    });
  };
  const closeModal = () => setIsOpen(false);
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
        className="m-2 flex basis-[16em] flex-col overflow-hidden border-2 border-solid border-gray-400 p-1"
        key={props.room.id}
      >
        <div className="flex min-w-0 flex-row items-center text-xl">
          <div className="shrink-0 grow-0">
            <InlineIcon i={<TypeIcon />} />
          </div>
          <div className="shrink grow overflow-hidden text-ellipsis">
            {props.room.roomName}
          </div>
        </div>
        <div className="flex shrink grow flex-row items-center">
          <div className="shrink-0 grow-0">
            <UserAvatar className="m-1 h-8 w-8" user={owner} />
          </div>
          <InlineIcon i={<Icons.Chat.Owner />} />
          <div
            className={`shrink grow overflow-hidden text-ellipsis text-left`}
            style={{ wordBreak: 'keep-all' }}
          >
            {owner.displayName}
          </div>

          <div className="shrink-0 grow-0">
            <FTButton className="w-[4em]" onClick={() => onJoin()}>
              Join
            </FTButton>
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
  return (
    <div className="flex flex-row flex-wrap overflow-scroll">
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
  );
};
