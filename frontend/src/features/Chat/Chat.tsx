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
 *
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
      style={{
        height: '50em',
        padding: '2px',
        border: '1px solid useFetcher',
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
      }}
    >
      <div
        className="vertical left"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 見えているチャットルーム */}
        <div
          className="room-list"
          style={{
            border: '1px solid white',
            flexGrow: 1,
            flexShrink: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FTH3
            style={{
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            ChatRooms
          </FTH3>
          <div
            style={{
              padding: '2px',
              flexGrow: 1,
              flexShrink: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {visibleRooms.map((data: TD.ChatRoom) => {
              return (
                /* クリックしたルームにフォーカスを当てる */
                <div
                  className="room-list-element"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '2px',
                    border: '1px solid white',
                  }}
                  key={data.id}
                >
                  <div
                    className="joining-button"
                    style={{
                      flexGrow: 0,
                      flexBasis: 0,
                    }}
                  >
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
                    style={{
                      flexGrow: 1,
                      flexBasis: 1,
                      padding: '4px',
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
        <div
          style={{
            border: '1px solid white',
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <OpenCard sender={command.open} />
        </div>
      </div>

      <div
        className="vertical right"
        style={{
          flexGrow: 1,
          flexShrink: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 今フォーカスしているルーム */}
        {!!computed.focusedRoom && (
          <div
            className="room-main"
            style={{
              display: 'flex',
              flexDirection: 'row',
              border: '1px solid white',
              padding: '2px',
              height: '100%',
            }}
          >
            <div
              className="room-left-pane"
              style={{
                flexGrow: 1,
                flexShrink: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {/* 今フォーカスしているルームのメッセージ */}
              <div
                className="room-message-list"
                style={{
                  border: '1px solid white',
                  flexGrow: 1,
                  flexShrink: 1,
                  overflow: 'scroll',
                }}
              >
                {store
                  .room_messages(focusedRoomId)
                  .map((data: TD.ChatRoomMessage) => (
                    <ChatRoomMessageCard key={data.id} message={data} />
                  ))}
              </div>
              <div
                className="input-panel"
                style={{
                  padding: '2px',
                  border: '1px solid white',
                  flexGrow: 0,
                  flexShrink: 0,
                }}
              >
                {/* 今フォーカスしているルームへの発言 */}
                <div
                  style={{
                    padding: '2px',
                    border: '1px solid white',
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <SayCard sender={command.say} />
                </div>
              </div>
            </div>
            <div
              className="room-right-pane"
              style={{
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: '20em',
              }}
            >
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
