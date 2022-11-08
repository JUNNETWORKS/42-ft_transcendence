import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { InlineIcon } from '@/hocs/InlineIcon';

const DmRoomListItem = (props: {
  room: TD.ChatRoom;
  isJoined: boolean;
  isFocused: boolean;
  nMessages: number | undefined;
  onFocus: (roomId: number) => void;
}) => {
  return (
    <>
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
        {props.room.roomName}{' '}
        {(() => {
          const n = props.nMessages;
          return Utils.isfinite(n) && n > 0 ? `(${n})` : '';
        })()}
      </div>
    </>
  );
};

export const DmRoomListView = (props: {
  rooms: TD.ChatRoom[];
  isJoiningTo: (roomId: number) => boolean;
  isFocusingTo: (roomId: number) => boolean;
  countMessages: (roomId: number) => number | undefined;
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
            <DmRoomListItem
              room={room}
              isJoined={props.isJoiningTo(room.id)}
              isFocused={props.isFocusingTo(room.id)}
              nMessages={props.countMessages(room.id)}
              onFocus={props.onFocus}
            />
          </div>
        );
      })}
    </>
  );
};
