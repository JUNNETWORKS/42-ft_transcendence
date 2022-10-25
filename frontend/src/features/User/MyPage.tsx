import { authAtom } from '@/atoms/auth';
import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useAtom } from 'jotai';
import { Link, useRoutes } from 'react-router-dom';
import { FriendsView } from './FriendsView';

export const MyPageView = () => {
  const [personalData] = useAtom(authAtom.personalDataAtom);

  const presentator = !personalData ? (
    <></>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
          is You!
        </FTH1>
        <div className="flex flex-col gap-2">
          <FTH4>name</FTH4>
          <div>{personalData.displayName}</div>
          <FTH4>email</FTH4>
          <div>{personalData.email}</div>
          <div>
            <Link to="/me/friends">Friends</Link>
            <FTButton>Stats(stub)</FTButton>
            <FTButton>Blocked(stub)</FTButton>
          </div>
        </div>
      </div>
    </div>
  );

  const myPageRoutes = [
    { path: '/', element: presentator },
    { path: '/friends/*', element: <FriendsView /> },
  ];
  const routeElements = useRoutes([...myPageRoutes]);
  return <>{routeElements}</>;
};
