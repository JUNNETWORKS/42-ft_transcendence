import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pong } from './components/Pong';

export const MatchPage: React.FC = () => {
  const { matchID } = useParams();

  useEffect(() => {}, []);

  return (
    <div>
      <h1>Pong Match Page</h1>
      <Pong />
    </div>
  );
};
