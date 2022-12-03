import { useState } from 'react';

import { FTButton } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';

import { InvitePrivateCard } from './InvitePrivateCard';

export const InvitePrivateButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)}>
        <InvitePrivateCard></InvitePrivateCard>
      </Modal>
      <div className="m-1">
        <FTButton onClick={() => setIsOpen(true)}>invite</FTButton>
      </div>
    </>
  );
};
