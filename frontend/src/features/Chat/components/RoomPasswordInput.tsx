import React from 'react';

import { FTButton, FTH3, FTTextField } from '@/components/FTBasicComponents';

type RoomPasswordInputProps = {
  roomPassword: string;
  setRoomPassword: React.Dispatch<React.SetStateAction<string>>;
  joinError: string;
  onJoin: () => void;
  onClose: () => void;
};

export const RoomPasswordInput = ({
  roomPassword,
  setRoomPassword,
  joinError,
  onJoin,
  onClose,
}: RoomPasswordInputProps) => {
  return (
    <div className="flex w-80 flex-col border-2 border-solid border-white bg-black">
      <FTH3>Input Room Password</FTH3>
      <div className="p-2">
        <FTTextField
          className="w-full border-2"
          type="password"
          value={roomPassword}
          placeholder="room password"
          onChange={(e) => setRoomPassword(e.target.value)}
        />
        <div className="text-red-400">
          {joinError !== '' ? joinError : '　'}
        </div>
      </div>
      <div className="flex flex-row justify-center p-2">
        <FTButton className="mx-4" onClick={onJoin}>
          Join
        </FTButton>
        <FTButton className="mx-4" onClick={onClose}>
          Cancel
        </FTButton>
      </div>
    </div>
  );
};
