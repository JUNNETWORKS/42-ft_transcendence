import { useAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate, useOutlet } from 'react-router-dom';
import { io } from 'socket.io-client';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { authAtom } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import { DmRoom } from '@/typedef';

import { Switcher } from '../Chat/components/Switcher';
import { useFocusedDmRoomId } from '../Chat/hooks/useFocusedRoomId';
import { ChatRoomListView } from '../Chat/RoomList';
import { CreateDMCard } from './components/CreateDMCard';

/**
 * @returns DMインターフェースコンポーネント
 */
export const DmPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const navigate = useNavigate();
  const [dmRooms] = useAtom(dataAtom.dmRoomsAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const focusedRoomId = useFocusedDmRoomId();
  const [isOpen, setIsOpen] = useState(false);
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

  const closeModal = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Modal closeModal={closeModal} isOpen={isOpen}>
        <CreateDMCard closeModal={closeModal} dmRooms={dmRooms} />
      </Modal>
      <div
        id="dm"
        className="flex w-full flex-row border-2 border-solid border-white p-2"
      >
        <div className="flex shrink-0 grow-0 basis-[16em] flex-col overflow-hidden">
          <div className="flex w-full shrink grow flex-col overflow-hidden border-2 border-solid border-white">
            <Switcher />
            <div className="shrink-0 grow-0 p-2">
              <FTButton
                className="flex w-full flex-row justify-center"
                onClick={openModal}
              >
                <InlineIcon i={<Icons.Add />} />
                新規作成
              </FTButton>
            </div>
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
                        textDecorationLine: isBlocking
                          ? 'line-through'
                          : 'none',
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
    </>
  );
};
