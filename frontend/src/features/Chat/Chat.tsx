import { useAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate, useOutlet } from 'react-router-dom';
import { io } from 'socket.io-client';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { dataAtom } from '@/stores/structure';

import { makeCommand } from './command';
import { useFocusedRoomId } from './hooks/useFocusedRoomId';
import { ChatRoomListView } from './RoomList';
import { ChatRoomCreateCard } from './RoomSetting';

/**
 * @returns チャットインターフェースコンポーネント
 */
export const Chat = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;
  const navigate = useNavigate();
  const [joiningRooms] = useAtom(dataAtom.joiningRoomsAtom);
  const focusedRoomId = useFocusedRoomId();
  const [isOpen, setIsOpen] = useState(false);
  const outlet = useOutlet();
  /**
   * チャットコマンド
   */
  const command = makeCommand(mySocket, focusedRoomId);

  /**
   * わざわざ分けなくてもいいかな
   */
  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRooms.find((r) => r.chatRoom.id === roomId),
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
        <ChatRoomCreateCard
          key="new"
          onSucceeded={closeModal}
          onCancel={closeModal}
        />
      </Modal>
      <div className="flex w-full flex-row border-2 border-solid border-white p-2">
        <div className="flex shrink-0 grow-0 basis-[16em] flex-col overflow-hidden">
          {/* 見えているチャットルーム */}
          <div className="flex w-full shrink grow flex-col overflow-hidden border-2 border-solid border-white">
            <FTH3 className="shrink-0 grow-0">You Joined</FTH3>
            <div className="shrink-0 grow-0 p-2">
              <FTButton className="w-full" onClick={openModal}>
                <InlineIcon i={<Icons.Add />} />
                新規作成
              </FTButton>
            </div>
            <div className="flex shrink grow flex-col overflow-hidden p-2">
              <ChatRoomListView
                rooms={joiningRooms.map((r) => r.chatRoom)}
                isJoiningTo={predicate.isJoiningTo}
                isFocusingTo={predicate.isFocusingTo}
                onJoin={command.join}
                onLeave={command.leave}
                onFocus={(roomId: number) => {
                  if (predicate.isJoiningTo(roomId)) {
                    navigate(`/chat/${roomId}`);
                  }
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
