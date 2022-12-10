import { useAtom } from 'jotai';

import { authAtom } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import * as Utils from '@/utils';

const DmRoomListItem = (props: {
  room: TD.DmRoom;
  isJoined: boolean;
  isFocused: boolean;
  onFocus: (roomId: number) => void;
}) => {
  const [personalData] = useAtom(authAtom.personalData);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  if (!personalData) return null;

  const opponent = props.room.roomMember.find(
    (member) => member.userId !== personalData.id
  )?.user;
  if (!opponent) {
    return null;
  }
  const isBlocking = !!blockingUsers.find((u) => u.id === opponent.id);
  const roomName = opponent.displayName;
  return (
    <div
      className="flex min-w-0 shrink grow cursor-pointer flex-row p-[4px] hover:bg-gray-700"
      style={{
        fontWeight: props.isFocused ? 'bold' : 'normal',
        textDecorationLine: isBlocking ? 'line-through' : 'none',
        ...(props.isFocused ? { borderRight: '12px solid teal' } : {}),
      }}
      onClick={() => props.onFocus(props.room.id)}
    >
      <div className="shrink grow overflow-hidden text-ellipsis">
        {roomName}
      </div>
    </div>
  );
};

export const DmRoomListView = (props: {
  rooms: TD.DmRoom[];
  isJoiningTo: (roomId: number) => boolean;
  isFocusingTo: (roomId: number) => boolean;
  onFocus: (roomId: number) => void;
}) => {
  return (
    <div className="overflow-y-auto overflow-x-hidden">
      {props.rooms.map((room: TD.DmRoom) => {
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
            <DmRoomListItem
              key={room.id}
              room={room}
              isJoined={props.isJoiningTo(room.id)}
              isFocused={props.isFocusingTo(room.id)}
              onFocus={props.onFocus}
            />
          </div>
        );
      })}
    </div>
  );
};
