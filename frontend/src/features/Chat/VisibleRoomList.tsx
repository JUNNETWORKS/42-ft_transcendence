import { useState } from 'react';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
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
  const TypeIcon = RoomTypeIcon[props.room.roomType];

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
        className="m-2 h-[200px] basis-[360px] overflow-hidden border-2 border-solid border-white"
        key={props.room.id}
      >
        <FTH3 className="flex min-w-0 flex-row items-center text-xl">
          <div className="shrink-0 grow-0">
            <InlineIcon i={<TypeIcon />} />
          </div>
          <div className="shrink grow overflow-hidden text-ellipsis">
            {props.room.roomName}
          </div>
        </FTH3>

        <FTButton className="w-[4em]" onClick={() => onJoin()}>
          Join
        </FTButton>
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
