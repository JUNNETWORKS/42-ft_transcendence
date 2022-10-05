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
  const [roomList, setRoomList] = useState<string[]>([]);
  // 今フォーカスしているチャットルームの表示用メッセージリスト
  const [messageList, setMessageList] = useState<string[]>([]);
  // 今発言用に入力しているメッセージ
  const [content, setContent] = useState('');
  // 今フォーカスしているチャットルームのID
  const [currentRoomId, setCurrentRoomId] = useState<number>(1);
  const [roomIdToJoin, setRoomIdToJoin] = useState('');

  const messagesInChannel: { [key: string]: ChannelMessage[] } = {};
  messagesInChannel[`#1`] = [];

  useEffect(() => {
    socket.on('ft_connection', (data: any) => {
      console.log('catch connection');
      console.log(data);
    });

    socket.on('ft_say', (data: any) => {
      console.log('catch say');
      console.log(data);
      setMessageList((messageList) => [...messageList, data]);
    });

    socket.on('ft_join', (data: any) => {
      console.log('catch join');
      console.log(data);
    });

    return () => {
      socket.off('ft_connection');
      socket.off('ft_say');
      socket.off('ft_join');
    };
  }, []);

  const sendJoin = () => {
    const data = {
      roomId: 1,
      callerId: 1,
    };
    console.log(data);
    socket.emit('ft_join', data);
  };

  const sendSay = () => {
    if (!currentRoomId) {
      return;
    }
    const data = {
      roomId: currentRoomId,
      callerId: 1,
      content: content,
    };
    console.log(data);
    socket.emit('ft_say', data);
  };

  return (
    <div>
      <div className="message-list">
        {messageList.map((data: any, index) => {
          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
              key={index}
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
      <div className="input-panel">
        <div className="content">
          <input
            id="input"
            autoComplete="off"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button onClick={sendSay}>Send</button>
        </div>
        <div className="room">
          <input
            id="input"
            autoComplete="off"
            value={roomIdToJoin}
            onChange={(e) => setRoomIdToJoin(e.target.value)}
          />
          <button onClick={sendJoin}>Join</button>
        </div>
      </div>
    </div>
  );
};
