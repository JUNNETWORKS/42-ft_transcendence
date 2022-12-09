import { Dialog, Transition } from '@headlessui/react';
import { ReactNode, Fragment } from 'react';

type TransitionParams = Parameters<typeof Transition>[0];

type Props = {
  children: ReactNode;
  closeModal: VoidFunction;
  isOpen: boolean;
  /**
   * トランジションを丸ごと入れ替える
   */
  tra?: TransitionParams;
  /**
   * デフォルトトランジションの一部をパッチする
   */
  traPart?: Partial<TransitionParams>;
  /**
   * 背景に別のトランジションをパッチする
   */
  backTraPart?: Partial<TransitionParams>;
};

export const Modal = ({
  children,
  closeModal,
  isOpen,
  tra,
  traPart,
  backTraPart,
}: Props) => {
  /**
   * 本体のデフォルトトランジション
   */
  const defaultPanelParams: TransitionParams = {
    enter: 'transition duration-100 ease-out',
    enterFrom: 'transform scale-95 opacity-0',
    enterTo: 'transform scale-100 opacity-100',
    leave: 'transition duration-75 ease-out',
    leaveFrom: 'transform scale-100 opacity-100',
    leaveTo: 'transform scale-95 opacity-0',
  };
  const effectivePanelParams = {
    ...((tra as any) || defaultPanelParams),
    ...(traPart || {}),
  };
  /**
   * 背景のデフォルトトランジション
   */
  const defaultBackdropParams: TransitionParams = {
    enter: 'transition duration-100 ease-out',
    enterFrom: 'opacity-0',
    enterTo: 'opacity-100',
    leave: 'transition duration-75 ease-out',
    leaveFrom: 'opacity-100',
    leaveTo: 'opacity-0',
  };
  const effectiveBackdropParams = {
    ...((tra as any) || defaultBackdropParams),
    ...(traPart || {}),
    ...(backTraPart || {}),
  };
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={closeModal}>
        <Transition.Child {...effectiveBackdropParams} as={Fragment}>
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>
        <Transition.Child {...effectivePanelParams} as={Fragment}>
          <div className="fixed inset-0 flex items-center justify-center ">
            <Dialog.Panel className="mx-auto rounded bg-primary">
              {children}
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};
