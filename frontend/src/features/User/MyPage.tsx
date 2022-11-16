import { authAtom } from '@/stores/auth';
import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useAtom } from 'jotai';
import { Link, useRoutes } from 'react-router-dom';
import { FriendsView } from './FriendsView';
import { BlockingView } from './BlockingView';

export const MyPageView = () => {
  const [personalData] = useAtom(authAtom.personalData);

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
            <Link to="/me/friends" className="border-2 p-2">
              Friends
            </Link>
            <Link to="/me/blocking" className="border-2 p-2">
              BlockingUsers
            </Link>
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
    { path: '/blocking/*', element: <BlockingView /> },
  ];
  const routeElements = useRoutes([...myPageRoutes]);
  return <>{routeElements}</>;
};
