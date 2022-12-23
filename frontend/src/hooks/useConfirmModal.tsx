import { atom, useAtom } from 'jotai';

import { FTButton } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';

type ConfirmArg = {
  body: string;
  isDestructive?: boolean;
  affirm?: string;
  denial?: string;
};

type Resolve = (value: boolean | PromiseLike<boolean>) => void;
type Reject = (reason?: any) => void;
type Continuation = {
  resolve: Resolve;
  reject: Reject;
};

const confirmModalAtom = {
  arg: atom<ConfirmArg>({
    body: 'body',
    isDestructive: false,
    affirm: 'affirm',
    denial: 'denial',
  }),
  isOpen: atom(false),
  continuation: atom<Continuation | null>(null),
};

/**
 * 二択モーダルダイアログを表示するフック.
 * このフックが返す関数を呼び出すと,
 * 「2つのボタンのあるダイアログを表示し、いずれかのボタンが押されるとresolveされるPromise」
 * を返す.
 */
export const useConfirmModal = () => {
  const [, setArg] = useAtom(confirmModalAtom.arg);
  const [, setIsOpen] = useAtom(confirmModalAtom.isOpen);
  const [, setContinuation] = useAtom(confirmModalAtom.continuation);
  /**
   * 二択モーダルダイアログを表示する
   * @param body 本文
   * @param arg オプション(ボタンラベルなど)
   */
  const confirm = (body: string, arg: Omit<ConfirmArg, 'body'> = {}) => {
    return new Promise<boolean>((resolve, reject) => {
      setArg({
        ...arg,
        body,
      });
      setContinuation({ resolve, reject });
      setIsOpen(true);
    });
  };
  const confirmDestructive = (
    body: string,
    arg: Omit<ConfirmArg, 'body' | 'isDestructive'> = {}
  ) => {
    return confirm(body, { isDestructive: true, ...arg });
  };
  const confirmAndExec =
    (body: string, proc: () => any, arg: Omit<ConfirmArg, 'body'> = {}) =>
    async () => {
      if (await confirm(body, arg)) {
        proc();
      }
    };
  const confirmDestructiveAndExec =
    (body: string, proc: () => any, arg: Omit<ConfirmArg, 'body'> = {}) =>
    async () => {
      if (await confirmDestructive(body, arg)) {
        proc();
      }
    };
  return [
    confirm,
    confirmDestructive,
    confirmAndExec,
    confirmDestructiveAndExec,
  ] as const;
};

/**
 * 二択モーダルダイアログのコンポーネント.
 * 常にDOMツリー上にあるようにすること.
 */
export const useConfirmModalComponent = () => {
  const [arg] = useAtom(confirmModalAtom.arg);
  const [isOpen, setIsOpen] = useAtom(confirmModalAtom.isOpen);
  const [continuation, setContinuation] = useAtom(
    confirmModalAtom.continuation
  );
  const modal = () => {
    const affirmCloser = () => {
      if (continuation) {
        continuation.resolve(true);
      }
      setContinuation(null);
      setIsOpen(false);
    };
    const denialCloser = () => {
      if (continuation) {
        continuation.resolve(false);
      }
      setContinuation(null);
      setIsOpen(false);
    };
    return (
      <Modal isOpen={isOpen} closeModal={denialCloser}>
        <div className="flex min-w-[180px] flex-col p-4">
          <div className="flex flex-row justify-center p-4">
            <p className="shrink-0 grow-0">{arg.body}</p>
          </div>
          <div className="flex flex-row justify-center">
            {arg.isDestructive ? (
              <>
                <FTButton className="mx-2 min-w-[4em]" onClick={affirmCloser}>
                  {arg.affirm || 'DO'}
                </FTButton>
                <FTButton
                  className="mx-2 min-w-[4em] text-red-400"
                  onClick={denialCloser}
                >
                  {arg.denial || 'cancel'}
                </FTButton>
              </>
            ) : (
              <>
                <FTButton className="mx-2 min-w-[4em]" onClick={denialCloser}>
                  {arg.denial || 'cancel'}
                </FTButton>
                <FTButton
                  className="mx-2 min-w-[4em] font-bold text-blue-400"
                  onClick={affirmCloser}
                >
                  {arg.affirm || 'OK'}
                </FTButton>
              </>
            )}
          </div>
        </div>
      </Modal>
    );
  };
  return modal;
};
