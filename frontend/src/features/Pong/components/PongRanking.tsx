import { Suspense, useState } from 'react';

import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { APIError } from '@/errors/APIError';
import { useAPICallerWithCredential } from '@/hooks/useAPICaller';

import { RankingCard } from './RankingCard';

type UserForRanking = {
  rankPoint: number;
  user: {
    displayName: string;
    id: number;
    isEnabledAvatar: true;
  };
};

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
      <RankingCard id={1} />
      <RankingCard id={2} />
      <RankingCard id={3} />
      <RankingCard id={4} />
      <RankingCard id={5} />
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
