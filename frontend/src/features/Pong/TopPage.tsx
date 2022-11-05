import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const TopPage: React.FC = () => {
  const socketRef = useRef<Socket>();
  const navigate = useNavigate();

  useEffect(() => {
    // WebSocket initialization
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000/pong');
    }
    socketRef.current.on('pong.match_making.done', () => {
      // マッチメイキング完了通知
      // TODO: 対戦ページに遷移する
      navigate(`/pong/matches/${}`)
    });

    // とりあえず現時点ではページを開いた瞬間にランクマッチの待機キューに入る
    socketRef.current.emit('pnog.match_making.entry', {
      waitingQueueID: 'RANK'
    });
  }, []);

  return (
    <div>
      <h1>Pong</h1>
    </div>
  );
};
