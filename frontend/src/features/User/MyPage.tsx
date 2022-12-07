import { useAtom } from 'jotai';
import { Link, useRoutes } from 'react-router-dom';

import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { UserAvatar } from '@/components/UserAvater';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { authAtom, useLogout } from '@/stores/auth';

import { BlockingView } from './BlockingView';
import { FriendsView } from './FriendsView';

const MyPageContent = () => {
  const [user] = useAtom(authAtom.personalData);
  const [, confirmModal] = useConfirmModal();
  const logout = useLogout();
  if (!user) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="w-[28rem] basis-1 border-4 border-white">
        <FTH1 className="flex flex-row items-center p-[4px] text-5xl font-bold">
          <p
            className="shrink grow overflow-hidden text-ellipsis"
            style={{ wordBreak: 'keep-all' }}
          >
            {user.displayName}
          </p>
        </FTH1>

        <div className="flex flex-col">
          <div className="flex flex-row">
            <div className="shrink-0 grow-0">
              <FTH4>&nbsp;</FTH4>
              <UserAvatar
                className="h-24 w-24 border-8 border-solid border-gray-700"
                user={user}
              />
            </div>
            <div className="shrink grow overflow-hidden">
              <FTH4 className="">id</FTH4>
              <p className="p-1">{user.id}</p>

              <>
                <FTH4 className="">email</FTH4>
                <div className="overflow-hidden truncate p-1">{user.email}</div>
              </>
            </div>
          </div>

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

          <div className="my-4 flex flex-col bg-gray-800 p-6">
            <div className="text-center">
              <FTButton
                onClick={async () => {
                  if (
                    await confirmModal('ログアウトしますか？', {
                      affirm: 'ログアウトする',
                    })
                  ) {
                    logout();
                  }
                }}
              >
                Logout
              </FTButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyPageView = () => {
  const myPageRoutes = [
    { path: '/', element: <MyPageContent /> },
    { path: '/friends/*', element: <FriendsView /> },
    { path: '/blocking/*', element: <BlockingView /> },
  ];
  const routeElements = useRoutes([...myPageRoutes]);
  return <>{routeElements}</>;
};
