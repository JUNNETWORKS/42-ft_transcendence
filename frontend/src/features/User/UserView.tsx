import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useUpdateUser, useUserDataReadOnly } from '@/stores/store';
import { useAtom } from 'jotai';
import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import * as dayjs from 'dayjs';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { APIError } from '@/errors/APIError';
import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { DmCard } from '../DM/DmCard';
import { dataAtom, structureAtom } from '@/stores/structure';
import { FollowButton } from './components/FollowButton';
import { BlockButton } from './components/BlockButton';

type ActualViewProps = {
  user: TD.User;
};
const ActualView = ({ user }: ActualViewProps) => {
  const userId = user.id;
  const [friends] = useAtom(structureAtom.friends);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  // フレンドかどうか
  const isFriend = !!friends.find((f) => f.id === userId);
  const isBlocking = !!blockingUsers.find((f) => f.id === user.id);

  return (
    <>
      <FTH1 className="flex flex-row items-center p-[4px] text-4xl font-bold">
        <div className="inline-block shrink-0 grow-0 align-text-bottom">
          <OnlineStatusDot key={user.id} user={user} />
        </div>
        <p
          className="shrink grow overflow-hidden text-ellipsis"
          style={{ wordBreak: 'keep-all' }}
        >
          {user.displayName}
        </p>
        {isFriend && <Icons.User.Friend className="h-6 w-6 shrink-0 grow-0" />}
        {isBlocking && <Icons.User.Block className="h-6 w-6 shrink-0 grow-0" />}
      </FTH1>
      <div className="flex flex-col gap-2">
        <FTH4>id</FTH4>
        <div className="p-2">{user.id}</div>
        <FTH4>name</FTH4>
        <div className="p-2">{user.displayName}</div>
        <FTH4>heartbeat time</FTH4>
        <div className="p-2">
          {user.time ? dayjs(user.time).format('MM/DD HH:mm:ss') : 'offline'}
        </div>
        <FTH4>DM</FTH4>
        <div className="px-2 py-4">
          <DmCard user={user} />
        </div>

        <div>
          <FollowButton userId={user.id} isFriend={isFriend} />
          <BlockButton userId={user.id} isBlocking={isBlocking} />
        </div>
      </div>
    </>
  );
};

const Presentator = (props: {
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
  return <ActualView user={personalData} />;
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
            <Presentator userId={userId} onError={setError} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};
