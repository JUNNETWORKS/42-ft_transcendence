import { chatSocketAtom } from '@/stores/auth';
import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useAction } from '@/hooks';
import { useUpdateUser, useUserDataReadOnly } from '@/stores/store';
import { useAtom } from 'jotai';
import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as dayjs from 'dayjs';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { dataAtom } from '@/stores/structure';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { APIError } from '@/errors/APIError';
import { useManualErrorBoundary } from '@/components/ManualErrorBoundary';

const FollowButton = (props: { userId: number; isFriend: boolean }) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const command = {
    follow: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_follow', data);
      mySocket?.emit('ft_follow', data);
    },
    unfollow: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_unfollow', data);
      mySocket?.emit('ft_unfollow', data);
    },
  };

  type Phase = 'IsFriend' | 'IsNotFriend' | 'RunningUnfollow' | 'RunningFollow';
  const [phase, setPhase] = useState<Phase>(
    props.isFriend ? 'IsFriend' : 'IsNotFriend'
  );
  const [setIsRunning, isRunning] = useAction(false, (running) => {
    console.log('setIsRunning', running);
    if (!running) {
      return;
    }
    if (props.isFriend) {
      // Unfollow
      setPhase('RunningUnfollow');
      command.unfollow(props.userId);
    } else {
      // Follow
      setPhase('RunningFollow');
      command.follow(props.userId);
    }
  });

  useEffect(() => {
    if (props.isFriend) {
      setPhase('IsFriend');
    } else {
      setPhase('IsNotFriend');
    }
    setIsRunning(false);
  }, [props.isFriend]);

  const text = (() => {
    switch (phase) {
      case 'IsFriend':
        return 'Unfollow';
      case 'IsNotFriend':
        return 'Follow';
      case 'RunningFollow':
        return 'Following...';
      case 'RunningUnfollow':
        return 'Unfollowing...';
    }
  })();

  return (
    <>
      <FTButton disabled={isRunning} onClick={() => setIsRunning(true)}>
        {text}
      </FTButton>
    </>
  );
};

const PresentatorView = (props: { personalData: TD.User }) => {
  const [friends] = useAtom(dataAtom.friends);
  // フレンドかどうか
  const isFriend = !!friends.find((f) => f.id === props.personalData.id);
  return (
    <>
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
