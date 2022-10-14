import { ReactNode, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

type Props = {
  children: ReactNode;
  closeModal: VoidFunction;
  isOpen: boolean;
};

export const Modal = ({ children, closeModal, isOpen }: Props) => {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog open={isOpen} onClose={closeModal}>
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center ">
          <Transition.Child
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Dialog.Panel className="mx-auto rounded bg-primary">
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
