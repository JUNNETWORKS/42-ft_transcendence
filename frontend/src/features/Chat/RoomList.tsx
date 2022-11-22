import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTButton } from '@/components/FTBasicComponents';
import { InlineIcon } from '@/hocs/InlineIcon';
import { RoomTypeIcon } from './RoomSetting';
import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { RoomPasswordInput } from './components/RoomPasswordInput';
import { validateRoomPasswordError } from './components/RoomPassword.validator';

const ChatRoomShiftButton = (props: {
  isJoined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) => {
  return props.isJoined ? (
    <FTButton
      className="w-[4em] bg-white text-black hover:bg-black hover:text-white"
      onClick={() => props.onLeave()}
    >
      Leave
    </FTButton>
  ) : (
    <FTButton className="w-[4em]" onClick={() => props.onJoin()}>
      Join
    </FTButton>
  );
};

const ChatRoomListItem = (props: {
  room: TD.ChatRoom;
  isJoined: boolean;
  isFocused: boolean;
  nMessages: number | undefined;
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        closeModal={() => {
          setIsOpen(false);
        }}
      >
        <RoomPasswordInput
          roomPassword={roomPassword}
          setRoomPassword={setRoomPassword}
          joinError={joinError}
          onJoin={onJoin}
        />
      </Modal>
      <div className="shrink-0 grow-0">
        <ChatRoomShiftButton
          isJoined={props.isJoined}
          onJoin={
            props.room.roomType === 'LOCKED'
              ? () => {
                  setIsOpen(true);
                }
              : onJoin
          }
          onLeave={() => props.onLeave(props.room.id)}
        />
      </div>
      <div
        className="grow p-[4px]"
        style={{
          flexBasis: '1px',
          cursor: props.isJoined ? 'pointer' : 'unset',
          fontWeight: props.isJoined ? 'bold' : 'normal',
          ...(props.isFocused ? { borderLeft: '12px solid teal' } : {}),
        }}
        onClick={() => props.onFocus(props.room.id)}
      >
        <InlineIcon i={<TypeIcon />} />
        {props.room.roomName}{' '}
        {(() => {
          const n = props.nMessages;
          return Utils.isfinite(n) && n > 0 ? `(${n})` : '';
        })()}
      </div>
    </>
  );
};

export const ChatRoomListView = (props: {
  rooms: TD.ChatRoom[];
  isJoiningTo: (roomId: number) => boolean;
  isFocusingTo: (roomId: number) => boolean;
  countMessages: (roomId: number) => number | undefined;
  onJoin: (roomId: number, roomPassword: string, callback: any) => void;
  onLeave: (roomId: number) => void;
  onFocus: (roomId: number) => void;
}) => {
  return (
    <>
      {props.rooms.map((room: TD.ChatRoom) => {
        return (
          /* クリックしたルームにフォーカスを当てる */
          <div
            className="flex flex-row border-2 border-solid border-white p-[2px]"
            key={room.id}
          >
            <ChatRoomListItem
              room={room}
              isJoined={props.isJoiningTo(room.id)}
              isFocused={props.isFocusingTo(room.id)}
              nMessages={props.countMessages(room.id)}
              onJoin={props.onJoin}
              onLeave={props.onLeave}
              onFocus={props.onFocus}
            />
          </div>
        );
      })}
    </>
  );
};
