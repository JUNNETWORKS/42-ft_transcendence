import { useAtom } from 'jotai';
import { useNavigate, useOutlet } from 'react-router-dom';
import { io } from 'socket.io-client';

import { FTH3 } from '@/components/FTBasicComponents';
import { authAtom } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import { DmRoom } from '@/typedef';

import { Switcher } from '../Chat/components/Switcher';
import { useFocusedDmRoomId } from '../Chat/hooks/useFocusedRoomId';
import { ChatRoomListView } from '../Chat/RoomList';

/**
 * @returns DMインターフェースコンポーネント
 */
export const DmPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const navigate = useNavigate();
  const [dmRooms] = useAtom(dataAtom.dmRoomsAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const focusedRoomId = useFocusedDmRoomId();
  const outlet = useOutlet();
  if (!personalData) {
    return null;
  }

  /**
   * わざわざ分けなくてもいいかな
   */
  const predicate = {
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => focusedRoomId > 0,
  };

  return (
    <div
      id="dm"
      className="flex w-full flex-row border-2 border-solid border-white p-2"
    >
      <div className="flex shrink-0 grow-0 basis-[16em] flex-col overflow-hidden">
        <div className="flex w-full shrink grow flex-col overflow-hidden border-2 border-solid border-white">
          <Switcher />
          <div className="flex shrink grow flex-col overflow-hidden p-2">
            <ChatRoomListView
              rooms={dmRooms}
              isFocusingTo={predicate.isFocusingTo}
              onFocus={(roomId: number) => {
                navigate(`/dm/${roomId}`);
              }}
              contentExtractor={(room: DmRoom) => {
                const opponent = room.roomMember.find(
                  (member) => member.userId !== personalData.id
                )?.user;
                if (!opponent) {
                  return null;
                }
                const isBlocking = !!blockingUsers.find(
                  (u) => u.id === opponent.id
                );
                const roomName = opponent.displayName;
                return (
                  <span
                    style={{
                      textDecorationLine: isBlocking ? 'line-through' : 'none',
                    }}
                  >
                    {roomName}
                  </span>
                );
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink grow flex-col">{outlet}</div>
    </div>
  );
};
