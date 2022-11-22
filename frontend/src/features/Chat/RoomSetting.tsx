import { useUpdateRoom } from '@/stores/store';
import { FTButton, FTH3, FTTextField } from '@/components/FTBasicComponents';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { Listbox } from '@headlessui/react';
import { useState } from 'react';
import { roomErrors } from './room.validator';

export const RoomTypeIcon = {
  PUBLIC: Icons.Chat.Public,
  PRIVATE: Icons.Chat.Private,
  LOCKED: Icons.Chat.Locked,
  DM: Icons.Chat.DM,
};

type RoomTypeListProps = {
  selected: TD.RoomType;
  setSelected: (next: TD.RoomType) => void;
};

const RoomTypeListBox = ({ selected, setSelected }: RoomTypeListProps) => {
  const roomTypes = TD.RoomTypesSelectable.map((t) => ({
    roomType: t,
    icon: RoomTypeIcon[t],
  }));
  const SelectedType = roomTypes.find((rt) => rt.roomType === selected)!;

  return (
    <>
      <Listbox
        value={SelectedType}
        onChange={(next: { roomType: TD.RoomType; icon: any }) =>
          setSelected(next.roomType)
        }
      >
        <Listbox.Button className="w-[9em] border-2 pl-2 pr-4 text-center">
          <InlineIcon i={<SelectedType.icon />} />
          {SelectedType.roomType}
        </Listbox.Button>
        <Listbox.Options className="absolute overflow-auto bg-black">
          {roomTypes.map((Item) => (
            <Listbox.Option
              className="cursor-pointer bg-black p-[2px] hover:bg-teal-800"
              key={Item.roomType}
              value={Item}
            >
              <InlineIcon i={<Item.icon />} />
              {Item.roomType}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Listbox>
    </>
  );
};

type Props = {
  room: TD.ChatRoom;
  onCancel: () => void;
  onSucceeded?: () => void;
};

export const ChatRoomSettingCard = ({ room, onCancel, onSucceeded }: Props) => {
  const [roomName, setRoomName] = useState(room.roomName);
  const [roomType, setRoomType] = useState<TD.RoomType>(room.roomType);
  const [roomPassword, setRoomPassword] = useState('');
  const errors = roomErrors(roomName, roomType, roomPassword, room);
  const { updateOne } = useUpdateRoom();
  const [state, submit] = useAPI('PUT', `/chatrooms/${room.id}`, {
    payload: () => ({ roomName, roomType, roomPassword }),
    onFetched: (json) => {
      updateOne(room.id, json as TD.ChatRoom);
      if (onSucceeded) {
        onSucceeded();
      }
    },
  });

  return (
    <>
      <div className="flex w-96 flex-col border-2 border-solid border-white bg-black">
        <FTH3>Room Setting</FTH3>
        <div className="flex flex-row p-2">
          <div className="basis-[6em] p-2">ROOM NAME</div>
          <div className="shrink grow">
            <FTTextField
              className="w-full border-2"
              autoComplete="off"
              value={roomName}
              placeholder="名前"
              onChange={(e) => setRoomName(e.target.value)}
            />
            <div>{errors.roomName || '　'}</div>
          </div>
        </div>

        <div className="flex flex-row p-2">
          <div className="basis-[6em] p-2">ROOM TYPE</div>
          {/* ↓ の z-10 は, 展開されたリストがdisabled状態のボタンを重なった時にボタンの方が上にくる、という現象を防ぐためのもの */}
          {/* https://ics.media/entry/200609/ */}
          <div className="z-10 shrink grow">
            <RoomTypeListBox selected={roomType} setSelected={setRoomType} />
          </div>
        </div>

        {roomType === 'LOCKED' && (
          <div className="flex flex-row p-2">
            <div className="basis-[6em] p-2">PASSWORD</div>
            <div className="shrink grow">
              <FTTextField
                className="w-full border-2"
                type="password"
                autoComplete="off"
                value={roomPassword}
                placeholder="空欄の場合は変更なし"
                onChange={(e) => setRoomPassword(e.target.value)}
              />
              <div>{errors.roomPassword || '　'}</div>
            </div>
          </div>
        )}

        <div className="p-2">
          <FTButton className="mr-2" onClick={onCancel}>
            Cancel
          </FTButton>
          <FTButton
            className="mr-2 disabled:opacity-50"
            disabled={errors.some || state !== 'Neutral'}
            onClick={submit}
          >
            <InlineIcon i={<Icons.Save />} />
            Save
          </FTButton>
        </div>
      </div>
    </>
  );
};
