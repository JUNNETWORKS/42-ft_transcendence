import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useUpdateUser, useUserDataReadOnly } from '@/stores/store';
import { useAtom } from 'jotai';
import { Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as dayjs from 'dayjs';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { APIError } from '@/errors/APIError';
import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { DmCard } from '../DM/DmCard';
import { Modal } from '@/components/Modal';
import { dataAtom, structureAtom } from '@/stores/structure';
import { FollowButton } from './components/FollowButton';
import { BlockButton } from './components/BlockButton';

type UserCardProp = {
  user: TD.User;
};
const UserCard = ({ user }: UserCardProp) => {
  const userId = user.id;
  const [friends] = useAtom(structureAtom.friends);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  // フレンドかどうか
  const isFriend = !!friends.find((f) => f.id === userId);
  const isBlocking = !!blockingUsers.find((f) => f.id === user.id);
  // DmModal
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Modal closeModal={() => setIsOpen(false)} isOpen={isOpen}>
        <DmCard user={user} onClose={() => setIsOpen(false)} />
      </Modal>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        <div className="inline-block align-text-bottom">
          <OnlineStatusDot key={user.id} user={user} />
        </div>
        {user.displayName}
        {isFriend && <Icons.User.Friend className="inline" />}
      </FTH1>
      <div className="flex flex-col gap-2">
        <FTH4>id</FTH4>
        <div>{user.id}</div>
        <FTH4>name</FTH4>
        <div>{user.displayName}</div>
        <FTH4>heartbeat time</FTH4>
        <div>
          {user.time ? dayjs(user.time).format('MM/DD HH:mm:ss') : 'offline'}
        </div>

        <div>
          <FollowButton userId={user.id} isFriend={isFriend} />
          <BlockButton userId={user.id} isBlocking={isBlocking} />
          <FTButton onClick={() => setIsOpen(true)}>DM</FTButton>
        </div>
      </div>
    </>
  );
};

const UserInnerView = (props: {
  userId: number;
  onError: (e: unknown) => void;
}) => {
  const userId = props.userId;
  const { addOne } = useUpdateUser();
  const personalData = useUserDataReadOnly(userId);
  if (!personalData) {
    throw (async () => {
      try {
        const result = await fetch(`http://localhost:3000/users/${userId}`, {
          method: 'GET',
          mode: 'cors',
        });
        if (!result.ok) {
          throw new APIError(result.statusText, result);
        }
        const json = await result.json();
        addOne(json as TD.User);
      } catch (e) {
        props.onError(e);
      }
    })();
  }
  return <UserCard user={personalData} />;
};

export const UserView = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  const [, setError, ErrorBoundary] = useManualErrorBoundary();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="w-[28rem] basis-1 border-4 border-white">
        <ErrorBoundary
          FallbackComponent={(error) => (
            <p>
              failed.
              <FTButton onClick={() => setError(null)}>Retry</FTButton>
            </p>
          )}
        >
          <Suspense fallback={<p>Loading...</p>}>
            <UserInnerView userId={userId} onError={setError} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};
