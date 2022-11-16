import { FTButton } from '@/components/FTBasicComponents';
import { useAction } from '@/hooks';
import { chatSocketAtom } from '@/stores/auth';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';

export const FollowButton = (props: { userId: number; isFriend: boolean }) => {
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
