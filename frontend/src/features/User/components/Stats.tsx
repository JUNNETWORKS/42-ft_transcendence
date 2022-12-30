import ordinal from 'ordinal';
import { Suspense, useEffect, useState } from 'react';

import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';
import { isfinite } from '@/utils';

import { Stats } from '../types/MatchResult';

type Props = {
  id: number;
  stats: Stats | null;
  setter: (data: Stats) => void;
  onError: (e: unknown) => void;
};

const RenderStats = ({ id, stats, setter, onError }: Props) => {
  const callAPI = useAPICallerWithCredential();
  useEffect(() => {
    (async () => {
      if (!stats) {
        try {
          console.log(`users/${id}/pong/stats`);
          const result = await callAPI('GET', `/users/${id}/pong/stats`);
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
  }, [callAPI, id, onError, setter, stats]);
  if (!stats) {
    return null;
  }
  return (
    <>
      <div className="mx-2">{`GameRecord: ${stats.winMatchCount} win - ${stats.loseMatchCount} lose`}</div>
      <div className="mx-2">{`WinRate: ${
        isfinite(stats.winRate) ? stats.winRate : '--'
      }%`}</div>
      <div className="mx-2">{`RankPlace: ${ordinal(stats.rankPlace)}`}</div>
    </>
  );
};

export const UserStats = ({ id }: { id: number }) => {
  const [userStats, setUserStats] = useState<Stats | null>(null);
  const [, setError, ErrorBoundary] = useManualErrorBoundary();

  const setter = (data: Stats) => {
    setUserStats(data);
  };

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<p>Loading...</p>}>
          <RenderStats
            stats={userStats}
            id={id}
            setter={setter}
            onError={setError}
          />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
