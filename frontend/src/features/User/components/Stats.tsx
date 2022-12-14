import ordinal from 'ordinal';
import { Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';

import { FTH3 } from '@/components/FTBasicComponents';
import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';

import { Stats } from '../types/MatchResult';

const RenderStats = ({
  id,
  stats,
  setter,
  onError,
}: {
  id: number;
  stats: Stats | null;
  setter: (data: Stats) => void;
  onError: (e: unknown) => void;
}) => {
  const callAPI = useAPICallerWithCredential();
  if (!stats) {
    throw (async () => {
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
    })();
  }
  return (
    <>
      <div className="mx-2">{`GameRecord: ${stats.winMatchCount} win - ${stats.loseMatchCount} lose`}</div>
      <div className="mx-2">{`WinRate: ${stats.winRate}%`}</div>
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
      <FTH3 className="flex min-w-0 flex-row items-center p-[4px] text-xl font-bold">
        Stats
      </FTH3>
      <ErrorBoundary>
        <Suspense fallback={<p>Loading...</p>}>
          <RenderStats
            id={id}
            stats={userStats}
            setter={setter}
            onError={setError}
          />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
