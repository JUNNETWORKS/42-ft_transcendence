import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTButton } from '@/components/FTBasicComponents';
import { InlineIcon } from '@/hocs/InlineIcon';
import { RoomTypeIcon } from './RoomSetting';

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
  onJoin: (roomId: number) => void;
  onLeave: (roomId: number) => void;
  onFocus: (roomId: number) => void;
}) => {
  const TypeIcon = RoomTypeIcon[props.room.roomType];

  return (
    <>
      <div className="shrink-0 grow-0">
        <ChatRoomShiftButton
          isJoined={props.isJoined}
          onJoin={() => props.onJoin(props.room.id)}
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
      </div>
    </>
  );
};

export const ChatRoomListView = (props: {
  rooms: TD.ChatRoom[];
  isJoiningTo: (roomId: number) => boolean;
  isFocusingTo: (roomId: number) => boolean;
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
