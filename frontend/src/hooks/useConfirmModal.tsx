import { FTButton } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { atom, useAtom } from 'jotai';

type ConfirmText = {
  body: string;
  affirmLabel?: string;
  denialLabel?: string;
};

type Resolve = (value: boolean | PromiseLike<boolean>) => void;
type Reject = (reason?: any) => void;
type Continuation = {
  resolve: Resolve;
  reject: Reject;
};
let confirmContinuation: Continuation | null = null;

const ticker = atom(0); // 変更検知用, 値はどうでも良い
const confirmModalAtom = {
  text: atom<ConfirmText>({
    body: 'body',
    affirmLabel: 'affirmLabel',
    denialLabel: 'denialLabel',
  }),
  isOpen: atom(false),
  continuation: atom(
    // 関数をatom化することは, 今のJotaiでは不可能または非常に困難なようなので,
    // 関数自体はatomではないただの変数に入れておく.
    // それだけだとJotaiが変更を検知しない(いつまでたっても初期値を返し続ける)ので, 変更検知のためだけのatom(ticker)を定義しておく.
    (get) => {
      get(ticker); // 変更検知用, 値はどうでも良い
      return confirmContinuation;
    },
    (get, set, newValue: Continuation | null) => {
      confirmContinuation = newValue;
      set(ticker, get(ticker) ^ 1);
    }
  ),
};

/**
 * 二択モーダルダイアログを表示するフック.
 * このフックが返す関数を呼び出すと,
 * 「2つのボタンのあるダイアログを表示し、いずれかのボタンが押されるとresolveされるPromise」
 * を返す.
 */
export const useConfirmModal = () => {
  const [, setText] = useAtom(confirmModalAtom.text);
  const [, setIsOpen] = useAtom(confirmModalAtom.isOpen);
  const [, setContinuation] = useAtom(confirmModalAtom.continuation);
  /**
   * 二択モーダルダイアログを表示する
   * @param body 本文
   * @param arg オプション(ボタンラベルなど)
   */
  const confirm = (body: string, arg: Omit<ConfirmText, 'body'> = {}) => {
    return new Promise<boolean>((resolve, reject) => {
      setText({
        ...arg,
        body,
      });
      setContinuation({ resolve, reject });
      setIsOpen(true);
    });
  };
  return confirm;
};

/**
 * 二択モーダルダイアログのコンポーネント.
 * 常にDOMツリー上にあるようにすること.
 */
export const useConfirmModalComponent = () => {
  const [text] = useAtom(confirmModalAtom.text);
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
            <p className="shrink-0 grow-0">{text.body}</p>
          </div>
          <div className="flex flex-row justify-center">
            <FTButton className="mx-2 min-w-[4em]" onClick={affirmCloser}>
              {text.affirmLabel || 'Yes'}
            </FTButton>
            <FTButton className="mx-2 min-w-[4em]" onClick={denialCloser}>
              {text.denialLabel || 'No'}
            </FTButton>
          </div>
        </div>
      </Modal>
    );
  };
  return modal;
};
