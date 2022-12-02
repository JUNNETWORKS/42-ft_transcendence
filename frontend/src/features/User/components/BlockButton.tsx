import { useAtom } from 'jotai';

import { FTButton } from '@/components/FTBasicComponents';
import { chatSocketAtom } from '@/stores/auth';

export const BlockButton = (props: { userId: number; isBlocking: boolean }) => {
  const [mySocket] = useAtom(chatSocketAtom);
  if (!mySocket) {
    return null;
  }
  const command = {
    block: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_block', data);
      mySocket.emit('ft_block', data);
    },
    unblock: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_unblock', data);
      mySocket.emit('ft_unblock', data);
    },
  };
  return (
    <FTButton
      className="w-20"
      onClick={() =>
        (props.isBlocking ? command.unblock : command.block)(props.userId)
      }
    >
      {props.isBlocking ? 'Unblock' : 'Block'}
    </FTButton>
  );
};
