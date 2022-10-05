import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';

const socket = io('http://localhost:3000/chat', {
  auth: (cb) => {
    cb({
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Inlva2F3YWRhQHN0dWRlbnQuNDJ0b2t5by5qcCIsInN1YiI6NSwiaWF0IjoxNjY0OTAzODU3LjUwNSwiZXhwIjoxNjY3NDk1ODU3LCJhdWQiOiJ0cmExMDAwIiwiaXNzIjoidHJhMTAwMCJ9.z9hmpKZDEyBgxfTN70EyPPWJLsyUCrJKHUZkIBup4Do',
    });
  },
});

export const Chat = () => {
  type ChannelMessage = any;
  // 見えているチャットルームの一覧
  const [visibleRoomList, setVisibleRoomList] = useState<any[]>([]);
  // join しているチャットルームの一覧
  const [joiningRoomList, setJoiningRoomList] = useState<any[]>([]);
  // 今発言用に入力しているメッセージ
  const [content, setContent] = useState('');
  // 今フォーカスしているチャットルームのID
  const [focusedRoomId, setFocusedRoomId] = useState<number>(NaN);
  // openしたいチャットルームの名前
  const [newRoomName, setNewRoomName] = useState('');

  const [messagesInChannel, setMessagesInChannel] = useState<{
    [key: string]: ChannelMessage[];
  }>({});

  useEffect(() => {
    socket.on('ft_connection', (data: any) => {
      console.log('catch connection');
      setJoiningRoomList(data.joiningRooms);
      setVisibleRoomList(data.visibleRooms);
    });

    socket.on('ft_say', (data: any) => {
      console.log('catch say');
      console.log(data);
      const roomId = data.chatRoomId;
      setMessagesInChannel((prev) => {
        const next: { [key: string]: ChannelMessage[] } = {};
        Object.keys(prev).forEach((key) => {
          next[key] = [...prev[key]];
        });
        if (!next[roomId]) {
          next[roomId] = [];
        }
        const messages = next[roomId];
        messages.push(data);
        next[roomId] = messages;
        console.log(next);
        console.log(roomId, focusedRoomId, next[roomId]);
        return next;
      });
      manip.focusRoom(roomId);
    });

    socket.on('ft_join', (data: any) => {
      console.log('catch join');
      setJoiningRoomList((prev) => {
        console.log('[data]', data);
        console.log('[joiningRoomList]', prev);
        const sameRoom = prev.find((r) => r.id === data.id);
        console.log(sameRoom);
        if (sameRoom) {
          return prev;
        }
        const newRoomList = [...prev];
        newRoomList.push(data);
        console.log(prev, '=>', newRoomList);
        return newRoomList;
      });
    });

    socket.on('ft_leave', (data: any) => {
      console.log('catch leave');
      setJoiningRoomList((prev) => {
        console.log('[data]', data);
        console.log('[joiningRoomList]', prev);
        const newRoomList = prev.filter((r) => r.id !== data.id);
        console.log(newRoomList.length);
        if (newRoomList.length === prev.length) {
          return prev;
        }
        console.log(prev, '=>', newRoomList);
        manip.unfocusRoom(data.id);
        return newRoomList;
      });
    });

    return () => {
      socket.off('ft_connection');
      socket.off('ft_say');
      socket.off('ft_join');
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
  };

  const manip = {
    focusRoom: (roomId: number) => {
      console.log(
        `[manip.focusRoom] predicate.isFocusingTo(${roomId})`,
        predicate.isFocusingTo(roomId)
      );
      if (!predicate.isFocusingTo(roomId)) {
        console.log('[manip.focusRoom] focus to', roomId);
        setFocusedRoomId(roomId);
        console.log(
          `[manip.focusRoom] roomId: ${roomId}, focusedRoomId: ${focusedRoomId}, `
        );
      }
      console.log(messagesInChannel);
      console.log(
        '[manip.focusRoom] keys',
        Object.keys(messagesInChannel).map((key) => [
          key,
          (messagesInChannel[key] || []).length,
        ])
      );
    },
    unfocusRoom: (roomId: number) => setFocusedRoomId(() => NaN),
  };

  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRoomList.find((r) => r.id === roomId),
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => !!focusedRoomId,
  };

  const computed = {
    messages: () => {
      const ms = messagesInChannel[focusedRoomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
  };

  const utils = {
    count_message: (roomId: number) => {
      const ms = messagesInChannel[roomId];
      if (!ms || ms.length === 0) {
        return 0;
      }
      return ms.length;
    },
  };

  return (
    <div
      style={{
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
        }}
      >
        {/* 見えているチャットルーム */}
        <div
          className="room-list"
          style={{
            padding: '2px',
            border: '1px solid gray',
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <h3>ChatRooms</h3>
          <div
            style={{
              padding: '2px',
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
                        manip.focusRoom(data.id);
                      }
                    }}
                  >
                    {data.id} / {data.roomName}{' '}
                    {(() => {
                      const n = utils.count_message(data.id);
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
          style={{ padding: '2px', border: '1px solid gray' }}
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

      {predicate.isFocusingToSomeRoom() && (
        <div
          className="vertical right"
          style={{
            flexGrow: 1,
            flexShrink: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 今フォーカスしているルームのメッセージ */}
          <div
            className="message-list"
            style={{
              padding: '2px',
              border: '1px solid gray',
              flexGrow: 1,
              flexShrink: 1,
            }}
          >
            <h3>Messages</h3>
            {computed.messages().map((data: any, index) => {
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
                      displayName: {data.displayName}
                    </div>
                    <div style={{ paddingRight: '4px' }}>
                      chatRoomId: {data.chatRoomId}
                    </div>
                    <div style={{ paddingRight: '4px' }}>
                      createdAt: {data.createdAt}
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
      )}
      <div>
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
