import { useMemo } from 'react';
import { io } from 'socket.io-client';
import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTH3 } from '@/components/FTBasicComponents';
import { ChatRoomView } from './RoomView';
import { OpenCard } from '@/components/CommandCard';
import { useAtom } from 'jotai';
import { userAtoms } from '@/stores/atoms';
import { ChatRoomListView } from './RoomList';
import { makeCommand } from './command';

/**
 * @returns チャットインターフェースコンポーネント
 */
export const Chat = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;

  const [personalData] = useAtom(userAtoms.personalDataAtom);
  const [visibleRooms] = useAtom(userAtoms.visibleRoomsAtom);
  const [joiningRooms] = useAtom(userAtoms.joiningRoomsAtom);
  const [messagesInRoom] = useAtom(userAtoms.messagesInRoomAtom);
  const [membersInRoom] = useAtom(userAtoms.membersInRoomAtom);
  const [focusedRoomId, setFocusedRoomId] = useAtom(
    userAtoms.focusedRoomIdAtom
  );
  const userId = personalData ? personalData.id : -1;
  // TODO: ユーザ情報は勝手に更新されうるので, id -> User のマップがどっかにあると良さそう。そこまで気を使うかはおいといて。

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
      !!joiningRooms.find((r) => r.id === roomId),
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
      () => visibleRooms.find((r) => r.id === focusedRoomId),
      [visibleRooms, focusedRoomId]
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
    count_message: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms) {
        return undefined;
      }
      return ms.length;
    },
    room_messages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
    room_members: (roomId: number) => {
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
    get_room_message: (roomId: number) => {
      if (roomId > 0) {
        if (!Utils.isfinite(store.count_message(roomId))) {
          command.get_room_messages(roomId);
        }
      }
    },

    get_room_members: (roomId: number) => {
      if (roomId > 0) {
        const mems = store.room_members(roomId);
        if (!mems) {
          command.get_room_members(roomId);
        }
      }
    },
  };

  return (
    <div
      className="flex w-full flex-row border-2 border-solid border-white p-2"
      style={{ height: '50em' }}
    >
      <div className="flex shrink-0 grow-0 flex-col">
        {/* 見えているチャットルーム */}
        <div className="flex shrink grow flex-col border-2 border-solid border-white">
          <FTH3 className="shrink-0 grow-0">ChatRooms</FTH3>
          <div className="flex shrink grow flex-col p-2">
            <ChatRoomListView
              rooms={visibleRooms}
              isJoiningTo={predicate.isJoiningTo}
              isFocusingTo={predicate.isFocusingTo}
              countMessages={store.count_message}
              onJoin={command.join}
              onLeave={command.leave}
              onFocus={(roomId: number) => {
                if (predicate.isJoiningTo(roomId)) {
                  setFocusedRoomId(roomId);
                  action.get_room_message(roomId);
                  action.get_room_members(roomId);
                }
              }}
            />
          </div>
        </div>
        <div className="border-2 border-solid border-white">
          <OpenCard sender={command.open} />
        </div>
      </div>

      <div className="flex shrink grow flex-col">
        {/* 今フォーカスしているルーム */}
        {!!computed.focusedRoom && (
          <ChatRoomView
            room={computed.focusedRoom}
            memberOperations={memberOperations}
            you={computed.you}
            say={command.say}
            room_messages={store.room_messages}
            room_members={store.room_members}
          />
        )}
      </div>
    </div>
  );
};
