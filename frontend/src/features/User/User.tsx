import { UserPersonalData } from '@/features/DevAuth/AuthCard';
import { FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
const usePersonalData = (userId: number) => {
  const [state, setState] = useState<FetchState>('Neutral');
  const [personalData, setPersonalData] = useState<UserPersonalData | null>(
    null
  );
  const fetchUrl = useRef('');
  useEffect(() => {
    // もうこのユーザのデータがあるなら終了
    const url = `http://localhost:3000/users/${userId}`;
    if (personalData && personalData.id === userId) {
      setState('Fetched');
      return;
    }
    // もうこのユーザのfetchが走っているなら終了
    if (fetchUrl.current === url) {
      return;
    }
    // 念の為データを破棄し, stateを変えてfetch開始
    fetchUrl.current = url;
    setPersonalData(null);
    setState('Fetching');
    (async () => {
      try {
        const result = await fetch(fetchUrl.current, {
          method: 'GET',
          mode: 'cors',
        });
        if (result.ok) {
          const user = await result.json();
          // fetch中にユーザIDが切り替わっていた場合は結果を捨てる
          if (fetchUrl.current === url) {
            setPersonalData(user);
            setState('Fetched');
          }
          return;
        }
      } catch (e) {
        console.error(e);
      }
      setState('Failed');
    })();
  }, [userId, personalData]);
  return [state, personalData] as const;
};

type UserCardProp = {
  personalData: UserPersonalData;
};
const UserCard = ({ personalData }: UserCardProp) => {
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
};

export const UserView = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  const [fetchState, personalData] = usePersonalData(userId);

  const presentator = () => {
    switch (fetchState) {
      case 'Fetched': {
        if (personalData) {
          return <UserCard personalData={personalData} />;
        }
      }
    }
    return <p>{fetchState}</p>;
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        {presentator()}
      </div>
    </div>
  );
};
