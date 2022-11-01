import { UserPersonalData } from '@/features/DevAuth/AuthCard';
import { FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
const usePersonalData = (userId: number) => {
  const [state, setState] = useState<FetchState>('Neutral');
  const [personalData, setPersonalData] = useState<UserPersonalData | null>(
    null
  );

  useEffect(() => {
    switch (state) {
      case 'Neutral':
        if (personalData) {
          setState('Fetched');
        } else {
          setState('Fetching');
        }
        break;
      case 'Fetching':
        (async () => {
          try {
            const result = await fetch(
              `http://localhost:3000/users/${userId}`,
              {
                method: 'GET',
                mode: 'cors',
              }
            );
            if (result.ok) {
              const user = await result.json();
              setPersonalData(user);
              setState('Fetched');
              return;
            }
          } catch (e) {
            console.error(e);
          }
          setState('Failed');
        })();
        break;
    }
  }, [state]);
  return [state, personalData] as const;
};

export const UserView = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  const [fetchState, personalData] = usePersonalData(userId);

  const presentator = () => {
    switch (fetchState) {
      case 'Fetched': {
        if (personalData) {
          return (
            <>
              <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
                {personalData.displayName}
              </FTH1>
              <div className="flex flex-col gap-2">
                <FTH4>id</FTH4>
                <div>{personalData.id}</div>
                <FTH4>name</FTH4>
                <div>{personalData.displayName}</div>
                <FTH4>email</FTH4>
                <div>{personalData.email}</div>
              </div>
            </>
          );
        }
        return <>{fetchState}</>;
      }
      case 'Neutral':
        return <>{fetchState}</>;
      case 'Fetching':
        return <>{fetchState}</>;
    }
    return <></>;
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        {presentator()}
      </div>
    </div>
  );
};
