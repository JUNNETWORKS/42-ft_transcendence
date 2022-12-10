import { useAtom } from 'jotai';
import { useNavigate, useOutlet } from 'react-router-dom';
import { io } from 'socket.io-client';

import { FTH3 } from '@/components/FTBasicComponents';
import { dataAtom } from '@/stores/structure';

import { useFocusedDmRoomId } from '../Chat/hooks/useFocusedRoomId';
import { DmRoomListView } from './DmRoomList';

/**
 * @returns DMインターフェースコンポーネント
 */
export const DmPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const navigate = useNavigate();
  const [dmRooms] = useAtom(dataAtom.dmRoomsAtom);
  const focusedRoomId = useFocusedDmRoomId();
  const outlet = useOutlet();

  /**
   * わざわざ分けなくてもいいかな
   */
  const predicate = {
    isJoiningTo: (roomId: number) => !!dmRooms.find((r) => r.id === roomId),
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => focusedRoomId > 0,
  };

  return (
    <div className="flex w-full flex-row border-2 border-solid border-white p-2">
      <div className="flex shrink-0 grow-0 basis-[16em] flex-col overflow-hidden">
        {/* 見えているチャットルーム */}
        <div className="flex w-full shrink grow flex-col overflow-hidden border-2 border-solid border-white">
          <FTH3 className="shrink-0 grow-0">DM</FTH3>
          <div className="flex shrink grow flex-col overflow-hidden p-2">
            <DmRoomListView
              rooms={dmRooms}
              isJoiningTo={predicate.isJoiningTo}
              isFocusingTo={predicate.isFocusingTo}
              onFocus={(roomId: number) => {
                if (predicate.isJoiningTo(roomId)) {
                  navigate(`/dm/${roomId}`);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink grow flex-col">{outlet}</div>
    </div>
  );
};
