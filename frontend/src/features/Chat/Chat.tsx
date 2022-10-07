import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import * as TD from './typedef';
import * as Utils from '@/utils';

const socket = io('http://localhost:3000/chat', {
  auth: (cb) => {
    cb({
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Inlva2F3YWRhQHN0dWRlbnQuNDJ0b2t5by5qcCIsInN1YiI6NSwiaWF0IjoxNjY1MDUzMTQ5LjYyNiwiZXhwIjoxNjY3NjQ1MTQ5LCJhdWQiOiJ0cmExMDAwIiwiaXNzIjoidHJhMTAwMCJ9.CQ7QIQWSEm9lNV4iHwq0-7doJG_ZVXLhzqPfbBIE49g',
    });
  },
});

/**
 * `id`の変化をトリガーとして何らかのアクションを行うフック
 * @param initialId `id`の初期値
 * @param action  `id`を受け取り, アクションを実行する関数
 */
function useAction<T>(initialId: T, action: (id: T) => void) {
  const [actionId, setActionId] = useState<T>(initialId);
  useEffect(() => action(actionId), [action, actionId]);
  return [setActionId];
}

/**
 * メッセージコンポーネント
 */
const ChatRoomMessage = (props: { message: TD.ChatRoomMessage }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '2px',
        border: '1px solid gray',
      }}
      key={props.message.id}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div style={{ paddingRight: '4px' }}>
          displayName: {props.message.user.displayName}
        </div>
        <div style={{ paddingRight: '4px' }}>
          chatRoomId: {props.message.chatRoomId}
        </div>
        <div style={{ paddingRight: '4px' }}>
          createdAt: {props.message.createdAt.toISOString()}
        </div>
      </div>
      <div>{props.message.content}</div>
    </div>
  );
};

/**
 * 発言を編集し, sendボタン押下で外部(props.sender)に送出するコンポーネント
 */
const Sayer = (props: { sender: (content: string) => void }) => {
  const [content, setContent] = useState('');
  const sender = () => {
    // クライアント側バリデーション
    if (!content.trim()) {
      return;
    }
    props.sender(content);
    setContent('');
  };
  const computed = {
    isSendable: () => {
      if (!content.trim()) {
        return false;
      }
      return true;
    },
  };

  return (
    <div
      className="content"
      style={{
        padding: '2px',
        border: '1px solid gray',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <div
        style={{
          flexGrow: 0,
          flexShrink: 0,
          padding: '2px',
        }}
      >
        <button disabled={!computed.isSendable()} onClick={sender}>
          Send
        </button>
      </div>
      <div
        style={{
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <input
          id="input"
          autoComplete="off"
          value={content}
          placeholder="発言内容"
          onChange={(e) => setContent(e.target.value)}
          style={{
            display: 'block',
            height: '100%',
            width: '100%',
            padding: '0',
          }}
        />
      </div>
    </div>
  );
};

/**
 *
 * @returns チャットインターフェースコンポーネント
 */
export const Chat = () => {
  type ChatRoomMessage = TD.ChatRoomMessage;
  // 見えているチャットルームの一覧
  const [visibleRoomList, setVisibleRoomList] = useState<TD.ChatRoom[]>([]);
  // join しているチャットルームの一覧
  const [joiningRoomList, setJoiningRoomList] = useState<TD.ChatRoom[]>([]);
  // 今フォーカスしているチャットルームのID
  const [focusedRoomId, setFocusedRoomId] = useState(-1);
  // openしたいチャットルームの名前
  const [newRoomName, setNewRoomName] = useState('');

  const [messagesInChannel, setMessagesInChannel] = useState<{
    [key: string]: ChatRoomMessage[];
  }>({});

  useEffect(() => {
    socket.on('ft_connection', (data: TD.ConnectionResult) => {
      console.log('catch connection');
      setJoiningRoomList(data.joiningRooms);
      setVisibleRoomList(data.visibleRooms);
    });

    socket.on('ft_say', (data: TD.SayResult) => {
      const message = TD.Mapper.chatRoomMessage(data);
      console.log('catch say');
      const roomId = data.chatRoomId;
      stateMutater.addMessagesToRoom(roomId, [message]);
    });

    socket.on('ft_join', (data: TD.JoinResult) => {
      console.log('catch join');
      setJoiningRoomList((prev) => {
        const { room } = data;
        const sameRoom = prev.find((r) => r.id === room.id);
        if (sameRoom) {
          return prev;
        }
        const newRoomList = [...prev];
        newRoomList.push(room);
        return newRoomList;
      });
    });

    socket.on('ft_leave', (data: TD.LeaveResult) => {
      console.log('catch leave');
      setJoiningRoomList((prev) => {
        const { room } = data;
        console.log(predicate.isFocusingTo(room.id), focusedRoomId, room.id);
        stateMutater.unfocusRoom(room.id);
        const newRoomList = prev.filter((r) => r.id !== room.id);
        if (newRoomList.length === prev.length) {
          return prev;
        }
        return newRoomList;
      });
    });

    socket.on('ft_get_room_messages', (data: TD.GetRoomMessagesResult) => {
      console.log('catch get_room_messages');
      const { id, messages } = data;
      console.log(id, !!messages);
      stateMutater.addMessagesToRoom(
        id,
        messages.map(TD.Mapper.chatRoomMessage)
      );
    });

    return () => {
      socket.off('ft_connection');
      socket.off('ft_say');
      socket.off('ft_join');
      socket.off('ft_leave');
      socket.off('ft_get_room_messages');
    };
  });

  const command = {
    join: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
      };
      console.log(data);
      socket.emit('ft_join', data);
    },

    leave: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
      };
      console.log(data);
      socket.emit('ft_leave', data);
    },

    say: (content: string) => {
      if (!focusedRoomId) {
        return;
      }
      const data = {
        roomId: focusedRoomId,
        callerId: 1,
        content,
      };
      console.log(data);
      socket.emit('ft_say', data);
    },

    get_room_messages: (roomId: number) => {
      const data = {
        roomId,
        take: 50,
        callerId: 1,
      };
      console.log(['get_room_messages'], data);
      socket.emit('ft_get_room_messages', data);
    },
  };

  const stateMutater = {
    // 指定したルームにフォーカス(フロントエンドで中身を表示)する
    focusRoom: (roomId: number) => {
      setFocusedRoomId((prev) => {
        if (predicate.isFocusingTo(roomId)) {
          // すでにフォーカスしている
          console.log('[focusRoom] stay');
          return prev;
        }
        // メッセージがないなら取得する
        action.get_room_message(roomId);
        return roomId;
      });
    },

    // ルームへのフォーカスをやめる
    unfocusRoom: (roomId: number) =>
      setFocusedRoomId((prev) => {
        console.log('unfocusing..');
        if (prev === roomId) {
          return -1;
        } else {
          return prev;
        }
      }),

    // チャットルームにメッセージを追加する
    // (メッセージは投稿時刻の昇順になる)
    addMessagesToRoom: (roomId: number, newMessages: TD.ChatRoomMessage[]) => {
      setMessagesInChannel((prev) => {
        const next: { [key: string]: ChatRoomMessage[] } = {};
        Object.keys(prev).forEach((key) => {
          next[key] = [...prev[key]];
        });
        if (!next[roomId]) {
          next[roomId] = [];
        }
        const messages = next[roomId];
        messages.push(...newMessages);
        next[roomId] = Utils.sortBy(
          Utils.uniqBy(messages, (m) => m.id),
          (m) => m.createdAt
        );
        return next;
      });
      stateMutater.focusRoom(roomId);
    },
  };

  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRoomList.find((r) => r.id === roomId),
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => focusedRoomId > 0,
  };

  const computed = {
    messages: useMemo(() => {
      const ms = messagesInChannel[focusedRoomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    }, [messagesInChannel, focusedRoomId]),
    focusedRoom: useMemo(
      () => visibleRoomList.find((r) => r.id === focusedRoomId),
      [visibleRoomList, focusedRoomId]
    ),
  };

  const store = {
    count_message: (roomId: number) => {
      const ms = messagesInChannel[roomId];
      if (!ms || ms.length === 0) {
        return 0;
      }
      return ms.length;
    },
    room_messages: (roomId: number) => {
      const ms = messagesInChannel[roomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
  };

  const action = {
    /**
     * 実態はステート更新関数.
     * レンダリング後に副作用フックでコマンドが走る.
     */
    get_room_message: useAction(0, (id) => {
      if (id > 0 && store.count_message(id) === 0) {
        command.get_room_messages(id);
      }
    })[0],
  };

  return (
    <div
      style={{
        height: '50em',
        padding: '2px',
        border: '1px solid gray',
        display: 'flex',
        flexDirection: 'row',
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
            padding: '2px',
            border: '1px solid gray',
            flexGrow: 1,
            flexShrink: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            ChatRooms {focusedRoomId}
          </h3>
          <div
            style={{
              padding: '2px',
              flexGrow: 1,
              flexShrink: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {visibleRoomList.map((data: TD.ChatRoom) => {
              return (
                /* クリックしたルームにフォーカスを当てる */
                <div
                  className="room-list-element"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '2px',
                    border: '1px solid gray',
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
                      <button
                        style={{ width: '4em' }}
                        onClick={() => command.leave(data.id)}
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        style={{ width: '4em' }}
                        onClick={() => command.join(data.id)}
                      >
                        Join
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      flexGrow: 1,
                      flexBasis: 1,
                      cursor: predicate.isJoiningTo(data.id)
                        ? 'pointer'
                        : 'unset',
                      fontWeight: predicate.isJoiningTo(data.id)
                        ? 'bold'
                        : 'normal',
                      backgroundColor: predicate.isFocusingTo(data.id)
                        ? 'lightgreen'
                        : 'unset',
                    }}
                    onClick={() => {
                      if (predicate.isJoiningTo(data.id)) {
                        stateMutater.focusRoom(data.id);
                      }
                    }}
                  >
                    {data.id} / {data.roomName}{' '}
                    {(() => {
                      const n = store.count_message(data.id);
                      return n > 0 ? `(${n})` : '';
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="new-room"
          style={{
            padding: '2px',
            border: '1px solid gray',
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <h4>Open</h4>
          <input
            id="input"
            autoComplete="off"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <button onClick={() => command.join(0)}>Open</button>
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
              border: '1px solid gray',
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
                  padding: '2px',
                  border: '1px solid gray',
                  flexGrow: 1,
                  flexShrink: 1,
                  overflow: 'scroll',
                }}
              >
                {computed.messages.map((data: TD.ChatRoomMessage) => (
                  <ChatRoomMessage key={data.id} message={data} />
                ))}
              </div>
              <div
                className="input-panel"
                style={{
                  padding: '2px',
                  border: '1px solid gray',
                  flexGrow: 0,
                  flexShrink: 0,
                }}
              >
                {/* 今フォーカスしているルームへの発言 */}
                <Sayer sender={command.say} />
              </div>
            </div>
            <div
              className="room-right-pane"
              style={{
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: '10em',
              }}
            >
              <div
                className="room-members"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <h4
                  style={{
                    flexGrow: 0,
                    flexShrink: 0,
                  }}
                >
                  Members
                </h4>
                <div
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: '20em',
          overflow: 'scroll',
        }}
      >
        <div>
          <h4>visibleRoomList</h4>
          {JSON.stringify(visibleRoomList)}
        </div>
        <div>
          <h4>joiningRoomList</h4>
          {JSON.stringify(joiningRoomList)}
        </div>
      </div>
    </div>
  );
};
