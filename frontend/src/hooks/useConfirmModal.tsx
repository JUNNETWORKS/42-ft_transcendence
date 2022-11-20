import { FTButton } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { atom, useAtom } from 'jotai';

type ConfirmText = {
  body: string;
  affirmLabel?: string;
  denialLabel?: string;
};

const confirmModalAtom = {
  text: atom<ConfirmText>({
    body: 'body',
    affirmLabel: 'affirmLabel',
    denialLabel: 'denialLabel',
  }),
  isOpen: atom(false),
};

let confirmResolve: ((value: boolean | PromiseLike<boolean>) => void) | null =
  null;
let confirmReject: ((reason?: any) => void) | null = null;

export const useConfirmModal = () => {
  const [, setText] = useAtom(confirmModalAtom.text);
  const [, setIsOpen] = useAtom(confirmModalAtom.isOpen);
  return (body: string, arg?: Omit<ConfirmText, 'body'>) => {
    return new Promise<boolean>((resolve, reject) => {
      setText({
        ...(arg || {}),
        body,
      });
      confirmResolve = resolve;
      confirmReject = reject;
      setIsOpen(true);
    });
  };
};

export const useConfirmModalComponent = () => {
  const [text] = useAtom(confirmModalAtom.text);
  const [isOpen, setIsOpen] = useAtom(confirmModalAtom.isOpen);
  const modal = () => {
    const affirmCloser = () => {
      if (confirmResolve) {
        confirmResolve(true);
      }
      confirmResolve = null;
      confirmReject = null;
      setIsOpen(false);
    };
    const denialCloser = () => {
      if (confirmResolve) {
        confirmResolve(false);
      }
      confirmResolve = null;
      confirmReject = null;
      setIsOpen(false);
    };
    return (
      <Modal isOpen={isOpen} closeModal={denialCloser}>
        <div className="flex min-w-[180px] flex-col p-4">
          <div className="flex flex-row justify-center p-4">
            <p className="shrink-0 grow-0">{text.body}</p>
          </div>
          <div className="flex flex-row justify-around">
            <FTButton onClick={affirmCloser}>
              {text.affirmLabel || 'Yes'}
            </FTButton>
            <FTButton onClick={denialCloser}>
              {text.denialLabel || 'No'}
            </FTButton>
          </div>
        </div>
      </Modal>
    );
  };
  return modal;
};
