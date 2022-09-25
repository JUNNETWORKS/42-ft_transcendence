import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export const Chat = () => {
  const [messageList, setMessageList] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('broadcast', (msg) => {
      console.log('catch message');
      console.log(msg);
      setMessageList((messageList) => [...messageList, msg.data]);
    });

    return () => {
      socket.off('broadcast');
    };
  }, []);

  const sendMessage = () => {
    socket.emit('message', { data: message });
  };

  return (
    <div>
      {messageList.map((data, index) => {
        return <p key={index}>{data}</p>;
      })}
      <input
        id="input"
        autoComplete="off"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};
