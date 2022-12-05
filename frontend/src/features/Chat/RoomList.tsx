import { useState } from 'react';

import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { RoomTypeIcon } from '@/icons';
import * as TD from '@/typedef';

import { validateRoomPasswordError } from './components/RoomPassword.validator';
import { RoomPasswordInput } from './components/RoomPasswordInput';

const ChatRoomListItem = (props: {
  room: TD.ChatRoom;
  isJoined: boolean;
  isFocused: boolean;
  onJoin: (roomId: number, roomPassword: string, callback: any) => void;
  onLeave: (roomId: number) => void;
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
        className="flex min-w-0 shrink grow cursor-pointer flex-row p-[4px] hover:bg-gray-700"
        style={{
          fontWeight: props.isFocused ? 'bold' : 'normal',
          ...(props.isFocused ? { borderRight: '12px solid teal' } : {}),
        }}
        onClick={() => props.onFocus(props.room.id)}
      >
        <div className="shrink-0 grow-0">
          <InlineIcon i={<TypeIcon />} />
        </div>
        <div className="shrink grow overflow-hidden text-ellipsis">
          {props.room.roomName}
        </div>
      </div>
    </>
  );
};

export const ChatRoomListView = (props: {
  rooms: TD.ChatRoom[];
  isJoiningTo: (roomId: number) => boolean;
  isFocusingTo: (roomId: number) => boolean;
  onJoin: (roomId: number, roomPassword: string, callback: any) => void;
  onLeave: (roomId: number) => void;
  onFocus: (roomId: number) => void;
}) => {
  return (
    <div className="overflow-scroll">
      {props.rooms.map((room: TD.ChatRoom) => {
        const isJoined = props.isJoiningTo(room.id);
        const isFocused = props.isFocusingTo(room.id);
        return (
          /* クリックしたルームにフォーカスを当てる */
          <div
            className={`my-1 flex min-w-0 flex-row border-2 border-solid ${
              isFocused ? 'border-gray-400' : 'border-transparent'
            } p-[2px] hover:border-white`}
            key={room.id}
            title={room.roomName}
          >
            <ChatRoomListItem
              room={room}
              isJoined={isJoined}
              isFocused={isFocused}
              onJoin={props.onJoin}
              onLeave={props.onLeave}
              onFocus={props.onFocus}
            />
          </div>
        );
      })}
    </div>
  );
};
