import { useState } from 'react';

import { FTButton } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons, RoomTypeIcon } from '@/icons';
import { useUserDataReadOnly } from '@/stores/store';
import * as TD from '@/typedef';

import { validateRoomPasswordError } from './RoomPassword.validator';
import { RoomPasswordInput } from './RoomPasswordInput';

export const VisibleRoomItem = (props: {
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
