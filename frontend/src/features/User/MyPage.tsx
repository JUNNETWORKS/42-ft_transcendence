import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { FTButton, FTH1, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { NumberButton } from '@/components/NumberButton';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useBlocking } from '@/hooks/useBlockings';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useFriends } from '@/hooks/useFriends';
import { usePersonalData } from '@/hooks/usePersonalData';
import { Icons } from '@/icons';
import { useLogout } from '@/stores/auth';

import { AuthBlock } from './components/AuthBlock';
import { EditPasswordCard } from './components/EditPasswordCard';
import { EditProfileCard } from './components/EditProfileCard';
import { MatchHistoryList } from './components/MatchHistory';
import { ProfileBlock } from './components/ProfileBlock';
import { UserStats } from './components/Stats';
import { FriendList, BlockingList } from './UserListCard';

const LogoutBlock = () => {
  const [, confirmModal] = useConfirmModal();
  const logout = useLogout();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col bg-gray-800 p-4">
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
  const [modalType, setModalType] = useState<
    'edit' | 'password' | 'friends' | 'blockings' | null
  >(null);
  const [user] = usePersonalData();
  const [friends] = useFriends();
  const [blockings] = useBlocking();

  if (!user) {
    return null;
  }
  const modalContent = (() => {
    switch (modalType) {
      case 'edit':
        return (
          <div className="flex w-[480px] flex-col justify-around gap-5 bg-primary p-8">
            <EditProfileCard user={user} onClose={() => setIsOpen(false)} />
          </div>
        );
      case 'password':
        return (
          <div className="flex w-[480px] flex-col justify-around gap-5 bg-primary p-8">
            <EditPasswordCard user={user} onClose={() => setIsOpen(false)} />
          </div>
        );
      case 'friends':
        return (
          <div className="flex w-[600px] flex-col justify-around">
            <FriendList onClose={() => setIsOpen(false)} />
          </div>
        );
      case 'blockings':
        return (
          <div className="flex w-[600px] flex-col justify-around">
            <BlockingList onClose={() => setIsOpen(false)} />
          </div>
        );
      default:
        return null;
    }
  })();
  return (
    <>
      <Modal closeModal={() => setIsOpen(false)} isOpen={isOpen}>
        {modalContent}
      </Modal>

      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-h-[100%] w-full flex-col items-center overflow-y-scroll p-0">
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
                <div className="shrink-0 grow-0">
                  <NumberButton
                    title="Friends"
                    num={friends.length}
                    onClick={() => {
                      setIsOpen(true);
                      setModalType('friends');
                    }}
                  />
                </div>
                <div className="shrink-0 grow-0">
                  <NumberButton
                    title="Blockings"
                    num={blockings.length}
                    onClick={() => {
                      setIsOpen(true);
                      setModalType('blockings');
                    }}
                  />
                </div>
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
            <div className="flex flex-col">
              <FTH3 className="sticky top-0 z-10 flex min-w-0 flex-row items-center p-[4px] text-xl font-bold">
                Stats
              </FTH3>
              <UserStats id={user.id} />
            </div>

            <div className="flex flex-col">
              <FTH3 className="sticky top-0 z-10 flex min-w-0 flex-row items-center p-[4px] text-xl font-bold">
                History
              </FTH3>
              <MatchHistoryList id={user.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const MyPageView = () => {
  return <MyPageContent />;
};
