import { useAtom } from 'jotai';
import { useState } from 'react';
import { Link, useNavigate, useRoutes } from 'react-router-dom';
import { toast } from 'react-toastify';

import { FTButton, FTH1 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { Icons } from '@/icons';
import { authAtom, useLogout } from '@/stores/auth';

import { BlockingView } from './BlockingView';
import { AuthBlock } from './components/AuthBlock';
import { EditPasswordCard } from './components/EditPasswordCard';
import { EditProfileCard } from './components/EditProfileCard';
import { ProfileBlock } from './components/ProfileBlock';
import { FriendsView } from './FriendsView';

const LogoutBlock = () => {
  const [, confirmModal] = useConfirmModal();
  const logout = useLogout();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col bg-gray-800 p-6">
      <div className="text-center">
        <FTButton
          onClick={async () => {
            if (
              await confirmModal('ログアウトしますか？', {
                affirm: 'ログアウトする',
              })
            ) {
              logout();
              toast('ログアウトしました');
              navigate('/');
            }
          }}
        >
          Logout
        </FTButton>
      </div>
    </div>
  );
};

const MyPageContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'edit' | 'password' | null>(null);
  const [user] = useAtom(authAtom.personalData);
  if (!user) {
    return null;
  }
  const modalContent = (() => {
    switch (modalType) {
      case 'edit':
        return <EditProfileCard user={user} onClose={() => setIsOpen(false)} />;
      case 'password':
        return (
          <EditPasswordCard user={user} onClose={() => setIsOpen(false)} />
        );

      default:
        return null;
    }
  })();
  return (
    <>
      <Modal closeModal={() => setIsOpen(false)} isOpen={isOpen}>
        <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
          {modalContent}
        </div>
      </Modal>

      <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
        <div className="w-[28rem] shrink-0 grow-0 basis-1 border-4 border-white">
          <FTH1 className="flex min-w-0 flex-row items-center p-[4px] text-5xl font-bold">
            <p
              className="shrink grow overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ wordBreak: 'keep-all' }}
            >
              {user.displayName}
            </p>
            <div className="shrink-0 grow-0 self-end">
              <FTButton
                className="text-2xl"
                onClick={() => {
                  setIsOpen(true);
                  setModalType('edit');
                }}
              >
                <InlineIcon i={<Icons.User.Edit />} />
              </FTButton>
            </div>
          </FTH1>

          <div className="flex flex-col">
            <ProfileBlock user={user} isYou={true} />

            <div className="flex flex-row items-center justify-center gap-4 p-3">
              <Link to="/dm" className="min-w-[4em] border-2 p-2 text-center">
                DM
              </Link>
              <Link
                to="/me/friends"
                className="min-w-[4em] border-2 p-2 text-center"
              >
                Friends
              </Link>
              <Link
                to="/me/blocking"
                className="min-w-[4em] border-2 p-2 text-center"
              >
                BlockingUsers
              </Link>
            </div>

            <AuthBlock
              user={user}
              onClickPassword={() => {
                setIsOpen(true);
                setModalType('password');
              }}
            />

            <LogoutBlock />
          </div>
        </div>
      </div>
    </>
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
