import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { io } from 'socket.io-client';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { authAtom } from '@/stores/auth';
import { dataAtom, structureAtom } from '@/stores/structure';
import * as TD from '@/typedef';

import { makeCommand } from './command';
import { ChatRoomListView } from './RoomList';
import { ChatRoomCreateCard } from './RoomSetting';
import { ChatRoomView } from './RoomView';
import { VisibleRoomList } from './VisibleRoomList';

/**
 * @returns チャットインターフェースコンポーネント
 */
export const Chat = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;

  const [personalData] = useAtom(authAtom.personalData);
  const [visibleRooms] = useAtom(dataAtom.visibleRoomsAtom);
  const [joiningRooms] = useAtom(dataAtom.joiningRoomsAtom);
  const [messagesInRoom] = useAtom(dataAtom.messagesInRoomAtom);
  const [membersInRoom] = useAtom(dataAtom.membersInRoomAtom);
  const [focusedRoomId, setFocusedRoomId] = useAtom(
    structureAtom.focusedRoomIdAtom
  );
  const userId = personalData ? personalData.id : -1;
  /**
   * チャットコマンド
   */
  const command = makeCommand(mySocket, focusedRoomId);
  const memberOperations: TD.MemberOperations = {
    onNomminateClick: command.nomminate,
    onBanClick: command.ban,
    onKickClick: command.kick,
    onMuteClick: command.mute,
  };

  /**
   * わざわざ分けなくてもいいかな
   */
  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRooms.find((r) => r.chatRoom.id === roomId),
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => focusedRoomId > 0,
  };

  /**
   * 算出プロパティ的なの
   */
  const computed = {
    messages: useMemo(() => {
      const ms = messagesInRoom[focusedRoomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    }, [messagesInRoom, focusedRoomId]),

    focusedRoom: useMemo(
      () => joiningRooms.find((r) => r.chatRoom.id === focusedRoomId),
      [joiningRooms, focusedRoomId]
    ),

    you: useMemo(() => {
      if (!userId) {
        return null;
      }
      if (!focusedRoomId) {
        return null;
      }
      const us = membersInRoom[focusedRoomId];
      if (!us) {
        return null;
      }
      return us[userId];
    }, [userId, focusedRoomId, membersInRoom]),
  };

  /**
   * 保持しているデータに対する参照
   */
  const store = {
    countMessages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms) {
        return undefined;
      }
      return ms.length;
    },
    roomMessages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
    roomMembers: (roomId: number) => {
      const ms = membersInRoom[roomId];
      if (!ms) {
        return null;
      }
      return ms;
    },
  };

  const action = {
    /**
     * 実態はステート更新関数.
     * レンダリング後に副作用フックでコマンドが走る.
     */
    get_room_members: (roomId: number) => {
      if (roomId > 0) {
        const mems = store.roomMembers(roomId);
        if (!mems) {
          command.get_room_members(roomId);
        }
      }
    },
  };

  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const contentInRightPain = (() => {
    if (computed.focusedRoom) {
      return (
        <ChatRoomView
          room={computed.focusedRoom.chatRoom}
          memberOperations={memberOperations}
          you={computed.you}
          say={command.say}
          roomMessages={store.roomMessages}
          roomMembers={store.roomMembers}
        />
      );
    } else {
      return (
        <VisibleRoomList
          rooms={visibleRooms}
          isJoiningTo={predicate.isJoiningTo}
          isFocusingTo={predicate.isFocusingTo}
          onJoin={command.join}
          onFocus={(roomId: number) => {
            if (predicate.isJoiningTo(roomId)) {
              setFocusedRoomId(roomId);
              action.get_room_members(roomId);
            }
          }}
        />
      );
    }
  })();

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
                    setFocusedRoomId(roomId);
                    action.get_room_members(roomId);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink grow flex-col">{contentInRightPain}</div>
      </div>
    </>
  );
};
