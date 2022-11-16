import { FTButton } from '@/components/FTBasicComponents';
import { useAction } from '@/hooks';
import { chatSocketAtom } from '@/stores/auth';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';

export const BlockButton = (props: { userId: number; isBlocking: boolean }) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const command = {
    block: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_block', data);
      mySocket?.emit('ft_block', data);
    },
    unblock: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_unblock', data);
      mySocket?.emit('ft_unblock', data);
    },
  };

  type Phase =
    | 'IsBlocking'
    | 'IsNotBlocking'
    | 'RunningUnblock'
    | 'RunningBlock';
  const [phase, setPhase] = useState<Phase>(
    props.isBlocking ? 'IsBlocking' : 'IsNotBlocking'
  );
  const [setIsRunning, isRunning] = useAction(false, (running) => {
    console.log('setIsRunning', running);
    if (!running) {
      return;
    }
    if (props.isBlocking) {
      // Unblock
      setPhase('RunningUnblock');
      command.unblock(props.userId);
    } else {
      // block
      setPhase('RunningBlock');
      command.block(props.userId);
    }
  });

  useEffect(() => {
    if (props.isBlocking) {
      setPhase('IsBlocking');
    } else {
      setPhase('IsNotBlocking');
    }
    setIsRunning(false);
  }, [props.isBlocking]);

  const text = (() => {
    switch (phase) {
      case 'IsBlocking':
        return 'Unblock';
      case 'IsNotBlocking':
        return 'Block';
      case 'RunningBlock':
        return 'Blocking...';
      case 'RunningUnblock':
        return 'UnBlocking...';
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
