import { Suspense, useState } from 'react';

import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';

import { UserForRanking } from '../types';
import { RankingCard } from './RankingCard';

const RenderRanking = ({
  ranking,
  setter,
  onError,
}: {
  ranking: UserForRanking[] | null;
  setter: (data: UserForRanking[]) => void;
  onError: (e: unknown) => void;
}) => {
  const callAPI = useAPICallerWithCredential();
  if (!ranking) {
    throw (async () => {
      try {
        const result = await callAPI('GET', `/pong/ranking`);
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
    <ul className="mt-2 flex flex-col gap-3">
      {ranking &&
        ranking.map((item, index) => {
          const rankPlace = index + 1; //index０が1位なので1足して調整
          return (
            <RankingCard key={item.user.id} rankPlace={rankPlace} user={item} />
          );
        })}
    </ul>
  );
};

export const PongRanking = () => {
  const [userRanking, setUserRanking] = useState<UserForRanking[] | null>(null);
  const [, setError, ErrorBoundary] = useManualErrorBoundary();

  const setter = (data: UserForRanking[]) => {
    setUserRanking(data);
  };

  return (
    <div className="grow-[1]">
      <p className="text-5xl font-bold leading-tight">Ranking</p>
      <div className=" h-2 w-[360] bg-primary"></div>
      <ErrorBoundary>
        <Suspense fallback={<p>Loading...</p>}>
          <RenderRanking
            ranking={userRanking}
            setter={setter}
            onError={setError}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
