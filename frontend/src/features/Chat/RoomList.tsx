import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTButton } from '@/components/FTBasicComponents';

const ChatRoomListItem = (props: {
  room: TD.ChatRoom;
  isJoined: boolean;
  isFocused: boolean;
  nMessages: number | undefined;
  onJoin: (roomId: number) => void;
  onLeave: (roomId: number) => void;
  onFocus: (roomId: number) => void;
}) => {
  return (
    <>
      <div className="shrink-0 grow-0">
        {props.isJoined ? (
          <FTButton
            className="bg-white text-black hover:bg-black hover:text-white"
            style={{ width: '4em' }}
            onClick={() => props.onLeave(props.room.id)}
          >
            Leave
          </FTButton>
        ) : (
          <FTButton
            style={{ width: '4em' }}
            onClick={() => props.onJoin(props.room.id)}
          >
            Join
          </FTButton>
        )}
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
        {props.room.id} / {props.room.roomName}{' '}
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
  onJoin: (roomId: number) => void;
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
