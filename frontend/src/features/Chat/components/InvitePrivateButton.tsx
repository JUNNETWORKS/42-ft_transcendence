import { useState } from 'react';

import { FTButton } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { ChatRoom } from '@/typedef';

import { InvitePrivateCard } from './InvitePrivateCard';

export const InvitePrivateButton = (props: { room: ChatRoom }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)}>
        <InvitePrivateCard room={props.room}></InvitePrivateCard>
      </Modal>
      <div className="m-1">
        <FTButton onClick={() => setIsOpen(true)}>invite</FTButton>
      </div>
    </>
  );
};
