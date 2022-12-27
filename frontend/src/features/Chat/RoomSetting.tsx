import { Listbox } from '@headlessui/react';
import { Dispatch, SetStateAction, useState } from 'react';
import { toast } from 'react-toastify';

import {
  FTBlockedHeader,
  FTButton,
  FTH3,
  FTTextField,
} from '@/components/FTBasicComponents';
import { SelectListBox } from '@/components/SelectListBox';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { Icons, RoomTypeIcon } from '@/icons';
import { useUpdateRoom } from '@/stores/store';
import * as TD from '@/typedef';

import { popAuthError } from '../Toaster/toast';
import { roomErrors } from './room.validator';

type UseStateFuncs<S> = {
  (initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  (): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
};

type UseStateFunc<S> = UseStateFuncs<S> extends {
  (...args: infer Params): infer Ret;
  (...args: any[]): any;
}
  ? { params: Params; ret: Ret }
  : never;

type ElementProps = {
  title: string;
  name: UseStateFunc<string>['ret'];
  type: UseStateFunc<TD.RoomType>['ret'];
  password: UseStateFunc<string>['ret'];
  errors: ReturnType<typeof roomErrors>;
  api: ReturnType<typeof useAPI>;
  onCancel: () => void;
  placeholder: {
    name?: string;
    password?: string;
  };
};

const CardElement = ({
  title,
  name: [roomName, setRoomName],
  type: [roomType, setRoomType],
  password: [roomPassword, setRoomPassword],
  errors,
  api: [state, submit],
  onCancel,
  placeholder = {},
}: ElementProps) => {
  return (
    <>
      <div className="flex w-96 flex-col border-2 border-solid border-white bg-black">
        <FTBlockedHeader>
          <FTButton onClick={onCancel} className="shrink-0 grow-0">
            <Icons.Cancel className="block" />
          </FTButton>
          <div className="shrink-0 grow-0">{title}</div>
        </FTBlockedHeader>
        <div className="flex flex-row p-2">
          <div className="basis-[6em] p-2">ROOM NAME</div>
          <div className="shrink grow">
            <FTTextField
              className="w-full border-2"
              autoComplete="off"
              value={roomName}
              placeholder={placeholder.name || '2文字以上 50文字以下'}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <div>{errors.roomName || '　'}</div>
          </div>
        </div>

        <div className="flex flex-row p-2">
          <div className="basis-[6em] p-2">ROOM TYPE</div>
          {/* ↓ の z-10 は, 展開されたリストがdisabled状態のボタンを重なった時にボタンの方が上にくる、という現象を防ぐためのもの */}
          {/* https://ics.media/entry/200609/ */}
          <div className="z-10 flex shrink grow items-center">
            <div>
              <SelectListBox<TD.RoomType>
                selected={roomType}
                items={[...TD.RoomTypesSelectable]}
                setItem={setRoomType}
                makeElement={(t) => {
                  const Icon = RoomTypeIcon[t];
                  return (
                    <div className="flex flex-row justify-center">
                      <InlineIcon i={<Icon />} />
                      <p className="basis-[4em]">{t}</p>
                    </div>
                  );
                }}
              />
            </div>
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
                placeholder={placeholder.password || '4文字以上 40文字以下'}
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
            disabled={
              errors.some || !(state === 'Neutral' || state === 'Failed')
            }
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

type CreateProps = {
  onCancel: () => void;
  onSucceeded?: () => void;
};

export const ChatRoomCreateCard = ({ onCancel, onSucceeded }: CreateProps) => {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<TD.RoomType>('PUBLIC');
  const [roomPassword, setRoomPassword] = useState('');
  const errors = roomErrors(roomName, roomType, roomPassword);
  const { addOne } = useUpdateRoom();
  const api = useAPI('POST', `/chatrooms`, {
    payload: () => {
      if (roomType === 'LOCKED') {
        return { roomName, roomType, roomPassword };
      }
      return { roomName, roomType };
    },
    onFetched: (json) => {
      addOne(json as TD.ChatRoom);
      if (onSucceeded) {
        onSucceeded();
      }
      toast('チャットルームを作成しました');
    },
    onFailed(e) {
      if (e instanceof TypeError) {
        popAuthError('ネットワークエラー');
      }
    },
  });

  return (
    <CardElement
      title={'CREATE ROOM'}
      name={[roomName, setRoomName]}
      type={[roomType, setRoomType]}
      password={[roomPassword, setRoomPassword]}
      errors={errors}
      api={api}
      onCancel={onCancel}
      placeholder={{}}
    />
  );
};

type Props = {
  room: TD.ChatRoom;
  onCancel: () => void;
  onSucceeded?: () => void;
};

export const ChatRoomUpdateCard = ({ room, onCancel, onSucceeded }: Props) => {
  const [roomName, setRoomName] = useState(room.roomName);
  const [roomType, setRoomType] = useState<TD.RoomType>(room.roomType);
  const [roomPassword, setRoomPassword] = useState('');
  const errors = roomErrors(roomName, roomType, roomPassword, room);
  const { updateOne } = useUpdateRoom();
  const api = useAPI('PUT', `/chatrooms/${room.id}`, {
    payload: () => {
      if (roomType === 'LOCKED' && roomPassword) {
        return { roomName, roomType, roomPassword };
      }
      return { roomName, roomType };
    },
    onFetched: (json) => {
      updateOne(room.id, json as TD.ChatRoom);
      if (onSucceeded) {
        onSucceeded();
      }
      toast('ルーム情報を更新しました');
    },
    onFailed(e) {
      if (e instanceof TypeError) {
        popAuthError('ネットワークエラー');
      }
    },
  });

  return (
    <CardElement
      title={'UPDATE ROOM'}
      name={[roomName, setRoomName]}
      type={[roomType, setRoomType]}
      password={[roomPassword, setRoomPassword]}
      errors={errors}
      api={api}
      onCancel={onCancel}
      placeholder={{
        password: room.roomType === 'LOCKED' ? '空欄なら変更なし' : '',
      }}
    />
  );
};
