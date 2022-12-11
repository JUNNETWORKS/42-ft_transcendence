import { InlineIcon } from '@/hocs/InlineIcon';
import { RoomTypeIcon } from '@/icons';
import * as TD from '@/typedef';

const ChatRoomListItem = (props: {
  room: TD.ChatRoom;
  isFocused: boolean;
  onFocus: (roomId: number) => void;
  contentExtractor: (room: any) => JSX.Element | null;
}) => {
  const TypeIcon = RoomTypeIcon[props.room.roomType];

  return (
    <>
      <div
        className="flex min-w-0 shrink grow cursor-pointer flex-row p-[4px] hover:bg-gray-700"
        style={{
          fontWeight: props.isFocused ? 'bold' : 'normal',
          ...(props.isFocused ? { borderRight: '12px solid teal' } : {}),
        }}
        onClick={() => props.onFocus(props.room.id)}
      >
        <div className="shrink-0 grow-0">
          <InlineIcon i={<TypeIcon />} />
        </div>
        <div className="shrink grow overflow-hidden text-ellipsis">
          {props.contentExtractor(props.room)}
        </div>
      </div>
    </>
  );
};

export const ChatRoomListView = (props: {
  rooms: TD.ChatRoom[];
  isFocusingTo: (roomId: number) => boolean;
  onFocus: (roomId: number) => void;
  contentExtractor: (room: any) => JSX.Element | null;
}) => {
  return (
    <div className="overflow-y-auto overflow-x-hidden">
      {props.rooms.map((room: TD.ChatRoom) => {
        const isFocused = props.isFocusingTo(room.id);
        return (
          /* クリックしたルームにフォーカスを当てる */
          <div
            className={`my-1 flex min-w-0 flex-row border-2 border-solid ${
              isFocused ? 'border-gray-400' : 'border-transparent'
            } p-[2px] hover:border-white`}
            key={room.id}
          >
            <ChatRoomListItem
              room={room}
              isFocused={isFocused}
              onFocus={props.onFocus}
              contentExtractor={props.contentExtractor}
            />
          </div>
        );
      })}
    </div>
  );
};
