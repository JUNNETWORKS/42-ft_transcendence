import { useAtom } from 'jotai';

import { FTButton } from '@/components/FTBasicComponents';
import { chatSocketAtom } from '@/stores/auth';

export const FollowButton = (props: { userId: number; isFriend: boolean }) => {
  const [mySocket] = useAtom(chatSocketAtom);
  if (!mySocket) {
    return null;
  }
  const command = {
    follow: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_follow', data);
      mySocket.emit('ft_follow', data);
    },
    unfollow: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_unfollow', data);
      mySocket.emit('ft_unfollow', data);
    },
  };
  return (
    <FTButton
      className="w-20"
      onClick={() =>
        (props.isFriend ? command.unfollow : command.follow)(props.userId)
      }
    >
      {props.isFriend ? 'Unfollow' : 'Follow'}
    </FTButton>
  );
};
