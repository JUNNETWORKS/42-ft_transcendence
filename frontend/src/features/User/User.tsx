import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useUpdateUser, useUserDataReadOnly } from '@/stores/store';
import { useAtom } from 'jotai';
import { Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as dayjs from 'dayjs';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { dataAtom } from '@/stores/structure';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { APIError } from '@/errors/APIError';
import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { DmModal } from '../DM/DmModal';
import { Modal } from '@/components/Modal';
import { FollowButton } from './components/FollowButton';
import { BlockButton } from './components/BlockButton';

const PresentatorView = (props: { personalData: TD.User }) => {
  const [friends] = useAtom(dataAtom.friends);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  // フレンドかどうか
  const isFriend = !!friends.find((f) => f.id === props.personalData.id);
  const isBlocking = !!blockingUsers.find(
    (f) => f.id === props.personalData.id
  );

  // DmModal
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Modal closeModal={() => setIsOpen(false)} isOpen={isOpen}>
        <DmModal user={props.personalData} onClose={() => setIsOpen(false)} />
      </Modal>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        <div className="inline-block align-text-bottom">
          <OnlineStatusDot
            key={props.personalData.id}
            user={props.personalData}
          />
        </div>
        {props.personalData.displayName}
        {isFriend && <Icons.User.Friend className="inline" />}
      </FTH1>
      <div className="flex flex-col gap-2">
        <FTH4>id</FTH4>
        <div>{props.personalData.id}</div>
        <FTH4>name</FTH4>
        <div>{props.personalData.displayName}</div>
        <FTH4>heartbeat time</FTH4>
        <div>
          {props.personalData.time
            ? dayjs(props.personalData.time).format('MM/DD HH:mm:ss')
            : 'offline'}
        </div>

        <div>
          <FollowButton userId={props.personalData.id} isFriend={isFriend} />
          <BlockButton userId={props.personalData.id} isBlocking={isBlocking} />
          <FTButton onClick={() => setIsOpen(true)}>{'DM'}</FTButton>
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
  return <PresentatorView personalData={personalData} />;
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
