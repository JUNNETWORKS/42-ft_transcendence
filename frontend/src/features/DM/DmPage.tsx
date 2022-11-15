import { useMemo } from 'react';
import { io } from 'socket.io-client';
import * as Utils from '@/utils';
import { FTH3 } from '@/components/FTBasicComponents';
import { DmRoomView } from './DmRoomView';
import { useAction } from '@/hooks';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth';
import { DmRoomListView } from './DmRoomList';
import { dataAtom, structureAtom } from '@/stores/structure';

function makeCommand(mySocket: ReturnType<typeof io>, focusedRoomId: number) {
  return {
    say: (content: string) => {
      if (!focusedRoomId) {
        return;
      }
      const data = {
        roomId: focusedRoomId,
        content,
      };
      console.log(data);
      mySocket?.emit('ft_say', data);
    },

    get_room_messages: (roomId: number) => {
      const data = {
        roomId,
        take: 50,
      };
      console.log(['get_room_messages'], data);
      mySocket?.emit('ft_get_room_messages', data);
    },

    get_room_members: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(['get_room_members'], data);
      mySocket?.emit('ft_get_room_members', data);
    },
  };
}

/**
 * @returns DMインターフェースコンポーネント
 */
export const DmPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;

  const [personalData] = useAtom(authAtom.personalData);
  const [dmRooms] = useAtom(dataAtom.dmRoomsAtom);
  const [messagesInRoom] = useAtom(dataAtom.messagesInRoomAtom);
  const [membersInRoom] = useAtom(dataAtom.membersInRoomAtom);
  const [focusedRoomId, setFocusedRoomId] = useAtom(
    structureAtom.focusedRoomIdAtom
  );
  const userId = personalData ? personalData.id : -1;

  // TODO: ユーザ情報は勝手に更新されうるので, id -> User のマップがどっかにあると良さそう。そこまで気を使うかはおいといて。

  /**
   * DMコマンド
   */
  const command = makeCommand(mySocket, focusedRoomId);

  /**
   * わざわざ分けなくてもいいかな
   */
  const predicate = {
    isJoiningTo: (roomId: number) => !!dmRooms.find((r) => r.id === roomId),
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
      () => dmRooms.find((r) => r.id === focusedRoomId),
      [dmRooms, focusedRoomId]
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
    get_room_message: useAction(0, (roomId) => {
      if (roomId > 0) {
        if (!Utils.isfinite(store.count_message(roomId))) {
          command.get_room_messages(roomId);
        }
      }
    })[0],

    get_room_members: useAction(0, (roomId) => {
      if (roomId > 0) {
        const mems = store.room_members(roomId);
        if (!mems) {
          command.get_room_members(roomId);
        }
      }
    })[0],
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
          <div className="shrink-0 grow-0 p-2 text-center"></div>
          <div className="flex shrink grow flex-col p-2">
            <DmRoomListView
              rooms={dmRooms}
              isJoiningTo={predicate.isJoiningTo}
              isFocusingTo={predicate.isFocusingTo}
              countMessages={store.count_message}
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
      </div>

      <div className="flex shrink grow flex-col">
        {/* 今フォーカスしているルーム */}
        {!!computed.focusedRoom && (
          <DmRoomView
            room={computed.focusedRoom}
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