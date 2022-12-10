import { Suspense, useEffect, useState } from 'react';

import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';
import { User } from '@/typedef';

import { MatchResult } from '../types/MatchResult';
import { HistoryCard } from './HistoryCard';

type Props = {
  id: number;
  matchHistory: MatchHistory | null;
  setter: (data: MatchHistory) => void;
  onError: (e: unknown) => void;
};

type MatchHistory = {
  user: User;
  history: { opponent: User; match: MatchResult }[];
};

const RenderHistory = ({ id, setter, onError, matchHistory }: Props) => {
  const callApi = useAPICallerWithCredential();
  useEffect(() => {
    (async () => {
      if (!matchHistory) {
        try {
          const result = await callApi('GET', `/users/${id}/pong/results`);
          if (!result.ok) {
            throw new APIError(result.statusText, result);
          }
          const json = await result.json();
          setter(json);
        } catch (e) {
          onError(e);
        }
      }
    })();
  }, [callApi, id, matchHistory, onError, setter]);

  return (
    <>
      {matchHistory && matchHistory.history.length === 0 && <div>Nothing</div>}
      {matchHistory && matchHistory.history.length > 0 && (
        <ul className="max-h-72 overflow-scroll">
          {matchHistory.history.map((match) => (
            <HistoryCard
              key={match.match.id}
              user={matchHistory.user}
              opponent={match.opponent}
              matchResult={match.match}
            />
          ))}
        </ul>
      )}
    </>
  );
};

export const MatchHistory = ({ id }: { id: number }) => {
  const [history, setHistory] = useState<MatchHistory | null>(null);
  const [, setError, ErrorBoundary] = useManualErrorBoundary();

  const setter = (data: MatchHistory) => {
    setHistory(data);
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<p>Loading...</p>}>
        <RenderHistory
          matchHistory={history}
          id={id}
          setter={setter}
          onError={setError}
        />
      </Suspense>
    </ErrorBoundary>
  );
};
