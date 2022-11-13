import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MatchCanvas } from './MatchCanvas';
import { io, Socket } from 'socket.io-client';

export const PongMatchPage: React.FC = () => {
  const socketRef = useRef<Socket>();
  const { matchID } = useParams();

  useEffect(() => {
    // WebSocket initialization
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000/pong');
    }

    // マッチの状態同期
    socketRef.current.on('pong.match.state', (data) => {
      // TODO: canvasに同期
    });
  }, []);

  return (
    <div>
      <h1>Pong Match Page</h1>
      <MatchCanvas />
    </div>
  );
};
