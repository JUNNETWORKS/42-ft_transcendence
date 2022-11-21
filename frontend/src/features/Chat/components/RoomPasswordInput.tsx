import { FTButton, FTH3, FTTextField } from '@/components/FTBasicComponents';
import React from 'react';

type RoomPasswordInputProps = {
  roomPassword: string;
  setRoomPassword: React.Dispatch<React.SetStateAction<string>>;
  joinError: string;
  onJoin: () => void;
};

export const RoomPasswordInput = ({
  roomPassword,
  setRoomPassword,
  joinError,
  onJoin,
}: RoomPasswordInputProps) => {
  return (
    <div className="flex w-96 flex-col border-2 border-solid border-white bg-black">
      <FTH3>Input Room Password</FTH3>
      <FTTextField
        className="w-full border-2"
        value={roomPassword}
        placeholder="room password"
        onChange={(e) => setRoomPassword(e.target.value)}
      />
      <div className="text-red-400">{joinError !== '' ? joinError : '　'}</div>
      <FTButton className="mr-2" onClick={onJoin}>
        Join
      </FTButton>
    </div>
  );
};
