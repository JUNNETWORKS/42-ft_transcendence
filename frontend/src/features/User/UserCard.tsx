import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useUpdateUser, useUserDataReadOnly } from '@/stores/store';
import { useAtom } from 'jotai';
import { ReactNode, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as dayjs from 'dayjs';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { APIError } from '@/errors/APIError';
import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';
import { dataAtom, structureAtom } from '@/stores/structure';
import { FollowButton } from './components/FollowButton';
import { BlockButton } from './components/BlockButton';
import { UserAvatar } from '@/components/UserAvater';
import { authAtom } from '@/stores/auth';
import { DmCard } from '../DM/DmCard';

type ActualCardProp = {
  user: TD.User;
  children?: ReactNode;
};
const ActualCard = ({ user, children }: ActualCardProp) => {
  const [personalData] = useAtom(authAtom.personalData);
  const userId = user.id;
  const [friends] = useAtom(structureAtom.friends);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  const navigation = useNavigate();
  if (!personalData) {
    return null;
  }
  const isYou = personalData.id === user.id;
  // フレンドかどうか
  const isFriend = !!friends.find((f) => f.id === userId);
  const isBlocking = !!blockingUsers.find((f) => f.id === user.id);
  return (
    <>
      <FTH1 className="flex flex-row items-center p-[4px] text-4xl font-bold">
        <div className="inline-block shrink-0 grow-0 align-text-bottom">
          <OnlineStatusDot key={user.id} user={user} />
        </div>
        <p className="shrink grow overflow-hidden text-ellipsis">
          {user.displayName}
        </p>
        {isFriend && <Icons.User.Friend className="h-6 w-6 shrink-0 grow-0" />}
        {isBlocking && <Icons.User.Block className="h-6 w-6 shrink-0 grow-0" />}
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

            {isYou ? (
              <>
                <FTH4 className="">email</FTH4>
                <div className="overflow-hidden truncate p-1">
                  {personalData.email}
                </div>
              </>
            ) : (
              <>
                <FTH4 className="">status</FTH4>
                <p className="p-1">
                  {user.time
                    ? dayjs(user.time).format('MM/DD HH:mm:ss')
                    : 'offline'}
                </p>
              </>
            )}
          </div>
        </div>

        {children}

        {!isYou && (
          <>
            <FTH4>DM</FTH4>
            <div className="px-2 py-4">
              <DmCard user={user} />
            </div>
          </>
        )}

        <div className="flex flex-row px-1 py-2">
          <div className="mx-1">
            <FTButton
              onClick={() => {
                navigation(isYou ? '/me' : `/user/${user.id}`);
              }}
            >
              User Page
            </FTButton>
          </div>

          {!isYou && (
            <div className="mx-1">
              <FollowButton userId={user.id} isFriend={isFriend} />
            </div>
          )}
          {!isYou && (
            <div className="mx-1">
              <BlockButton userId={user.id} isBlocking={isBlocking} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const Presentator = (props: {
  userId: number;
  children?: ReactNode;
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
  return <ActualCard user={personalData}>{props.children}</ActualCard>;
};

export const UserCard = (props: { id?: number; children?: ReactNode }) => {
  const { id } = useParams();
  const userId = parseInt(id || props.id?.toString() || '');
  const [, setError, ErrorBoundary] = useManualErrorBoundary();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="w-[20rem] basis-1 border-4 border-white">
        <ErrorBoundary
          FallbackComponent={(error) => (
            <p>
              failed.
              <FTButton onClick={() => setError(null)}>Retry</FTButton>
            </p>
          )}
        >
          <Suspense fallback={<p>Loading...</p>}>
            <Presentator userId={userId} onError={setError}>
              {props.children}
            </Presentator>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};
