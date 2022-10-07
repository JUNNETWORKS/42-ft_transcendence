import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
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

export const Chat = () => {
  type ChatRoomMessage = TD.ChatRoomMessage;
  // 見えているチャットルームの一覧
  const [visibleRoomList, setVisibleRoomList] = useState<any[]>([]);
  // join しているチャットルームの一覧
  const [joiningRoomList, setJoiningRoomList] = useState<any[]>([]);
  // 今発言用に入力しているメッセージ
  const [content, setContent] = useState('');
  // 今フォーカスしているチャットルームのID
  const [focusedRoomId, setFocusedRoomId] = useState(-1);
  // openしたいチャットルームの名前
  const [newRoomName, setNewRoomName] = useState('');

  const [messagesInChannel, setMessagesInChannel] = useState<{
    [key: string]: ChatRoomMessage[];
  }>({});

  useEffect(() => {
    socket.on('ft_connection', (data: any) => {
      console.log('catch connection');
      setJoiningRoomList(data.joiningRooms);
      setVisibleRoomList(data.visibleRooms);
    });

    socket.on('ft_say', (data: any) => {
      const message = TD.Mapper.chatRoomMessage(data);
      console.log('catch say');
      const roomId = data.chatRoomId;
      stateSetter.addMessagesToRoom(roomId, [message]);
      stateSetter.focusRoom(roomId);
    });

    socket.on('ft_join', (data: any) => {
      console.log('catch join');
      setJoiningRoomList((prev) => {
        const sameRoom = prev.find((r) => r.id === data.id);
        if (sameRoom) {
          return prev;
        }
        const newRoomList = [...prev];
        newRoomList.push(data);
        return newRoomList;
      });
    });

    socket.on('ft_leave', (data: any) => {
      console.log('catch leave');
      setJoiningRoomList((prev) => {
        console.log(predicate.isFocusingTo(data.id), focusedRoomId, data.id);
        stateSetter.unfocusRoom(data.id);
        // if (predicate.isFocusingTo(data.id)) {
        // }
        const newRoomList = prev.filter((r) => r.id !== data.id);
        if (newRoomList.length === prev.length) {
          return prev;
        }
        return newRoomList;
      });
    });

    socket.on('ft_get_room_messages', (data: any) => {
      console.log('catch get_room_messages');
      const { id, messages } = data;
      console.log(id, !!messages);
      stateSetter.addMessagesToRoom(
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
  }, []);

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

    say: () => {
      if (!focusedRoomId) {
        return;
      }
      const data = {
        roomId: focusedRoomId,
        callerId: 1,
        content: content,
      };
      console.log(data);
      socket.emit('ft_say', data);
      setContent('');
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

  const stateSetter = {
    // 指定したルームにフォーカス(フロントエンドで中身を表示)する
    focusRoom: (roomId: number) => {
      setFocusedRoomId((prev) => {
        if (predicate.isFocusingTo(roomId)) {
          // すでにフォーカスしている
          console.log('[focusRoom] stay');
          return prev;
        }
        // メッセージがないなら取得する
        console.log('[focusRoom]', roomId);
        if (store.count_message(roomId) === 0) {
          setFetchRoomId(roomId);
        }
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
    addMessagesToRoom: (roomId: number, newMessages: any[]) => {
      console.log('[addMessagesToChannel]', roomId, newMessages);
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
      stateSetter.focusRoom(roomId);
    },
  };

  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRoomList.find((r) => r.id === roomId),
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => focusedRoomId > 0,
  };

  const computed = {
    messages: () => {
      const ms = messagesInChannel[focusedRoomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
    focusedRoom: () => visibleRoomList.find((r) => r.id === focusedRoomId),
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

  const useFetchMessage = (initialRoomId: number) => {
    const [fetchRoomId, setFetchRoomId] = useState(initialRoomId);
    useEffect(() => {
      if (!(fetchRoomId > 0)) {
        return;
      }
      command.get_room_messages(fetchRoomId);
    }, [fetchRoomId]);
    return [setFetchRoomId];
  };
  const [setFetchRoomId] = useFetchMessage(0);

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
            {visibleRoomList.map((data: any, index) => {
              return (
                /* クリックしたルームにフォーカスを当てる */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '2px',
                    border: '1px solid gray',
                  }}
                  key={data.id}
                >
                  <div
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
                        stateSetter.focusRoom(data.id);
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
        {!!computed.focusedRoom() && (
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
                {computed.messages().map((data: TD.ChatRoomMessage, index) => {
                  return (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '2px',
                        border: '1px solid gray',
                      }}
                      key={data.id}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                        }}
                      >
                        <div style={{ paddingRight: '4px' }}>
                          displayName: {data.user.displayName}
                        </div>
                        <div style={{ paddingRight: '4px' }}>
                          chatRoomId: {data.chatRoomId}
                        </div>
                        <div style={{ paddingRight: '4px' }}>
                          createdAt: {data.createdAt.toISOString()}
                        </div>
                      </div>
                      <div>{data.content}</div>
                    </div>
                  );
                })}
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
                <div
                  className="content"
                  style={{ padding: '2px', border: '1px solid gray' }}
                >
                  <h4>Content</h4>
                  <input
                    id="input"
                    autoComplete="off"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <button onClick={command.say}>Send</button>
                </div>
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
