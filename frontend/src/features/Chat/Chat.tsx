import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';

const socket = io('http://localhost:3000/chat', {
  auth: (cb) => {
    cb({
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Inlva2F3YWRhQHN0dWRlbnQuNDJ0b2t5by5qcCIsInN1YiI6NSwiaWF0IjoxNjY0ODU5OTM2LjQ1NiwiZXhwIjoxNjY3NDUxOTM2LCJhdWQiOiJ0cmExMDAwIiwiaXNzIjoidHJhMTAwMCJ9.vudAYGwe5qdR9lBcK7zIlqpAU9_tRoeQvWhoeEjLmwc',
    });
  },
});

type AuxUserData = {
  callerId: number;
};

type ArgmentSay = {
  op: 'say';
  roomId: number;
  content: string;
} & AuxUserData;

function sendSay(
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  payload: Omit<ArgmentSay, 'op'>
) {
  socket.emit('say', { op: 'say', ...payload });
}

export const Chat = () => {
  const [messageList, setMessageList] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('broadcast', (msg: any) => {
      console.log('catch broadcast');
      console.log(msg);
      setMessageList((messageList) => [...messageList, msg.content]);
    });

    socket.on('say', (msg: any) => {
      console.log('catch say');
      console.log(msg);
      setMessageList((messageList) => [...messageList, msg.content]);
    });

    return () => {
      socket.off('broadcast');
      socket.off('say');
    };
  }, []);

  const sendMessage = () => {
    const data = {
      roomId: 1,
      callerId: 1,
      content: message,
    };
    sendSay(socket, data);
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
