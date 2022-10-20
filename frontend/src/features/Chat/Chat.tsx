import { useMemo } from 'react';
import { io } from 'socket.io-client';
import * as TD from '../../typedef';
import * as Utils from '@/utils';
import { FTButton, FTH3 } from '../../components/FTBasicComponents';
import { ChatRoomMembersList, ChatRoomMessageCard } from './Room';
import { useAction } from '../../hooks';
import { SayCard, OpenCard } from '../../components/CommandCard';
import { useAtom } from 'jotai';
import { userAtoms } from '@/atoms';

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
  const command = {
    open: (args: TD.OpenArgument) => {
      const data = {
        ...args,
      };
      console.log(data);
      mySocket?.emit('ft_open', data);
    },

    join: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(data);
      mySocket?.emit('ft_join', data);
    },

    leave: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(data);
      mySocket?.emit('ft_leave', data);
    },

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

    nomminate: (member: TD.ChatUserRelation) => {
      console.log('[nomminate]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_nomminate', data);
    },

    ban: (member: TD.ChatUserRelation) => {
      console.log('[ban]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_ban', data);
    },

    kick: (member: TD.ChatUserRelation) => {
      console.log('[kick]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_kick', data);
    },

    mute: (member: TD.ChatUserRelation) => {
      console.log('[mute]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_mute', data);
    },
  };
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
          <div className="flex shrink grow flex-col p-2">
            {visibleRooms.map((data: TD.ChatRoom) => {
              return (
                /* クリックしたルームにフォーカスを当てる */
                <div
                  className="flex flex-row border-2 border-solid border-white p-[2px]"
                  key={data.id}
                >
                  <div className="shrink-0 grow-0">
                    {predicate.isJoiningTo(data.id) ? (
                      <FTButton
                        className="bg-white text-black hover:bg-black hover:text-white"
                        style={{ width: '4em' }}
                        onClick={() => command.leave(data.id)}
                      >
                        Leave
                      </FTButton>
                    ) : (
                      <FTButton
                        style={{ width: '4em' }}
                        onClick={() => command.join(data.id)}
                      >
                        Join
                      </FTButton>
                    )}
                  </div>
                  <div
                    className="grow p-[4px]"
                    style={{
                      flexBasis: '1px',
                      cursor: predicate.isJoiningTo(data.id)
                        ? 'pointer'
                        : 'unset',
                      fontWeight: predicate.isJoiningTo(data.id)
                        ? 'bold'
                        : 'normal',
                      ...(predicate.isFocusingTo(data.id)
                        ? { borderLeft: '12px solid teal' }
                        : {}),
                    }}
                    onClick={() => {
                      if (predicate.isJoiningTo(data.id)) {
                        setFocusedRoomId(data.id);
                        action.get_room_message(data.id);
                        action.get_room_members(data.id);
                      }
                    }}
                  >
                    {data.id} / {data.roomName}{' '}
                    {(() => {
                      const n = store.count_message(data.id);
                      return Utils.isfinite(n) && n > 0 ? `(${n})` : '';
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-2 border-solid border-white">
          <OpenCard sender={command.open} />
        </div>
      </div>

      <div className="flex shrink grow flex-col">
        {/* 今フォーカスしているルーム */}
        {!!computed.focusedRoom && (
          <div className="flex h-full flex-row border-2 border-solid border-white p-2">
            <div className="flex h-full shrink grow flex-col overflow-hidden">
              {/* 今フォーカスしているルームのメッセージ */}
              <div className="shrink grow overflow-scroll border-2 border-solid border-white">
                {store
                  .room_messages(focusedRoomId)
                  .map((data: TD.ChatRoomMessage) => (
                    <ChatRoomMessageCard key={data.id} message={data} />
                  ))}
              </div>
              <div className="shrink-0 grow-0 border-2 border-solid border-white p-2">
                {/* 今フォーカスしているルームへの発言 */}
                <div className="flex flex-row border-2 border-solid border-white p-2">
                  <SayCard sender={command.say} />
                </div>
              </div>
            </div>
            <div className="shrink-0 grow-0 basis-[20em]">
              <ChatRoomMembersList
                you={computed.you}
                room={computed.focusedRoom}
                members={store.room_members(focusedRoomId) || {}}
                {...memberOperations}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
