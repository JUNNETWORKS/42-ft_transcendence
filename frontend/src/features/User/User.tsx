import { chatSocketAtom, userAtoms } from '@/atoms';
import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useAction, usePersonalData } from '@/hooks';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { useParams } from 'react-router-dom';

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

export const UserView = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  const [fetchState, personalData] = usePersonalData(userId);
  const [friends] = useAtom(userAtoms.friends);
  // フレンドかどうか
  const isFriend = !!friends.find((f) => f.id === userId);

  const presentator = (() => {
    console.log(userId, friends);
    switch (fetchState) {
      case 'Fetched': {
        if (personalData) {
          return (
            <>
              <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
                {personalData.displayName}
                {isFriend && <FaUserFriends className="inline" />}
              </FTH1>
              <div className="flex flex-col gap-2">
                <FTH4>id</FTH4>
                <div>{personalData.id}</div>
                <FTH4>name</FTH4>
                <div>{personalData.displayName}</div>

                <div>
                  <FollowButton userId={personalData.id} isFriend={isFriend} />
                </div>
              </div>
            </>
          );
        }
        return <>{fetchState}</>;
      }
      case 'Neutral':
        return <>{fetchState}</>;
      case 'Fetching':
        return <>{fetchState}</>;
    }
    return <></>;
  })();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        {presentator}
      </div>
    </div>
  );
};
