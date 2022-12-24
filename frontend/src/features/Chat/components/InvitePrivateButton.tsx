import { useState } from 'react';

import { FTButton } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { ChatRoom } from '@/typedef';

import { InvitePrivateCard } from './InvitePrivateCard';

export const InvitePrivateButton = (props: { room: ChatRoom }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)}>
        <InvitePrivateCard
          room={props.room}
          closeModal={() => setIsOpen(false)}
        ></InvitePrivateCard>
      </Modal>
      <div className="bg-black p-2">
        <FTButton
          className="flex w-full flex-row justify-center"
          onClick={() => setIsOpen(true)}
        >
          <InlineIcon i={<Icons.Add />} />
          Invite
        </FTButton>
      </div>
    </>
  );
};
