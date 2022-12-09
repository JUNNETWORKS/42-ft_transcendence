import { Popover } from '@headlessui/react';
import { ReactNode, useState } from 'react';
import { usePopper } from 'react-popper';

import { User } from '@/typedef';

type Prop = {
  user?: User;
  button?: ReactNode;
  children: ReactNode;
};

export const PopoverUserCard = ({ user, button, children }: Prop) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
  });
  if (!user && !button) {
    return null;
  }
  return (
    <Popover className="relative inline-block">
      {button || (
        <Popover.Button
          className="max-w-[20em] overflow-hidden text-ellipsis px-1 font-bold hover:underline"
          ref={setReferenceElement}
        >
          {user?.displayName}
        </Popover.Button>
      )}
      <Popover.Panel
        className="absolute z-10 border-8 border-gray-500 bg-black/90"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        {children}
      </Popover.Panel>
    </Popover>
  );
};
