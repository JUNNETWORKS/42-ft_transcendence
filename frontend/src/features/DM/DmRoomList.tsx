import { authAtom } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { useAtom } from 'jotai';

const DmRoomListItem = (props: {
  room: TD.DmRoom;
  isJoined: boolean;
  isFocused: boolean;
  nMessages: number | undefined;
  onFocus: (roomId: number) => void;
}) => {
  const [personalData] = useAtom(authAtom.personalData);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  if (!personalData) return null;

  const opponent = props.room.roomMember.find(
    (member) => member.userId !== personalData.id
  )!.user;
  if (blockingUsers.find((u) => u.id === opponent.id)) return null;
  const roomName = opponent.displayName;
  return (
    <div className="border-2 border-solid border-white p-[2px]">
      <div
        className="p-[4px]"
        style={{
          flexBasis: '1px',
          cursor: props.isJoined ? 'pointer' : 'unset',
          fontWeight: props.isJoined ? 'bold' : 'normal',
          ...(props.isFocused ? { borderLeft: '12px solid teal' } : {}),
        }}
        onClick={() => props.onFocus(props.room.id)}
      >
        {roomName}
        {(() => {
          const n = props.nMessages;
          return Utils.isfinite(n) && n > 0 ? `(${n})` : '';
        })()}
      </div>
    </div>
  );
};

export const DmRoomListView = (props: {
  rooms: TD.DmRoom[];
  isJoiningTo: (roomId: number) => boolean;
  isFocusingTo: (roomId: number) => boolean;
  countMessages: (roomId: number) => number | undefined;
  onFocus: (roomId: number) => void;
}) => {
  return (
    <>
      {props.rooms.map((room: TD.DmRoom) => {
        return (
          /* クリックしたルームにフォーカスを当てる */
          <DmRoomListItem
            key={room.id}
            room={room}
            isJoined={props.isJoiningTo(room.id)}
            isFocused={props.isFocusingTo(room.id)}
            nMessages={props.countMessages(room.id)}
            onFocus={props.onFocus}
          />
        );
      })}
    </>
  );
};
