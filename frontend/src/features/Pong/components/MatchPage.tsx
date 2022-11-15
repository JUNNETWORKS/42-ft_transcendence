import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MatchCanvas } from './MatchCanvas';
import { io, Socket } from 'socket.io-client';

export const PongMatchPage = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;
  const { matchID } = useParams();

  useEffect(() => {
    // マッチの状態同期
    mySocket.on('pong.match.state', (data) => {
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
