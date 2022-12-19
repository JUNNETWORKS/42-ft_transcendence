import { useAtom } from 'jotai';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { Icons } from '@/icons';
import { authAtom, useLoginLocal, UserPersonalData } from '@/stores/auth';

const urlGA = {
  play: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=ja&gl=US',
  appstore: 'https://apps.apple.com/jp/app/google-authenticator/id388497605',
};

/**
 * 2FA用のQRコードをユーザに表示するコンポーネント
 */
const QrcodeCard = (props: { qrcode: string; onClose: () => void }) => {
  return (
    <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
      <h3>二要素認証用QRコード</h3>
      <ul className="list-disc">
        <li>
          このQRコードは機密性の高いものです。
          <span className="text-red-400">
            画像として保存することはお控えください。
          </span>
        </li>
        <li>
          お使いのスマートフォンにて Google Authenticator アプリを起動し,
          下記QRコードをスキャンしてください。
        </li>
      </ul>
      <div className="flex flex-row justify-center">
        <p className="block p-2">アプリのインストール:</p>
        <a
          className="block p-2 underline"
          target="_blank"
          rel="noopener noreferrer"
          href={urlGA.play}
        >
          <InlineIcon i={<Icons.Android />} />
          Android
        </a>
        <a
          className="block p-2 underline"
          target="_blank"
          rel="noopener noreferrer"
          href={urlGA.appstore}
        >
          <InlineIcon i={<Icons.IOS />} />
          iOS
        </a>
      </div>
      <div className="text-center">
        <img className="inline object-cover" src={props.qrcode} />
      </div>
      <ul className="list-disc">
        <li>
          <span className="text-red-400">
            スキャンが完了したら直ちにCloseボタンを押してこの画面を閉じてください。
          </span>
        </li>
      </ul>
      <FTButton onClick={props.onClose}>Close</FTButton>
    </div>
  );
};

/**
 * 二要素認証を無効化するためのコンポーネント
 */
const Disable2FAButton = () => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [state, submit] = useAPI('PATCH', `/me/twoFa/disable`, {
    onFinished: () => {
      setPersonalData({ ...personalData!, isEnabled2FA: false });
      toast.info('二要素認証が無効化されました', { autoClose: 5000 });
    },
    onFailed(e) {
      if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
        });
      }
    },
  });
  const [, confirmModal] = useConfirmModal();
  if (!personalData) {
    return null;
  }
  return (
    <FTButton
      className="disabled:opacity-50"
      disabled={state === 'Fetching'}
      onClick={async () => {
        if (
          await confirmModal('二要素認証を無効化しますか？', {
            affirm: '無効化する',
          })
        ) {
          submit();
        }
      }}
    >
      無効にする
    </FTButton>
  );
};

type Enable2FACardProp = { onSucceeded: (qrcode: string) => void };

/**
 * 二要素認証を有効化するためのコンポーネント
 */
const Enable2FAButton = ({ onSucceeded }: Enable2FACardProp) => {
  const [personalData] = useAtom(authAtom.personalData);
  const loginLocal = useLoginLocal();
  const [state, submit] = useAPI('PATCH', `/me/twoFa/enable`, {
    onFetched: (json) => {
      const data = json as { access_token: string; qrcode: string };
      loginLocal(data.access_token, { ...personalData!, isEnabled2FA: true });
      onSucceeded(data.qrcode);
      toast.info('二要素認証が有効化されました', { autoClose: 5000 });
    },
    onFailed(e) {
      if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
        });
      }
    },
  });
  const [, confirmModal] = useConfirmModal();
  if (!personalData) {
    return null;
  }
  return (
    <FTButton
      className="disabled:opacity-50"
      disabled={state === 'Fetching'}
      onClick={async () => {
        if (
          await confirmModal('二要素認証を有効化しますか？', {
            affirm: '有効化する',
          })
        ) {
          submit();
        }
      }}
    >
      有効にする
    </FTButton>
  );
};

type Prop = {
  user: UserPersonalData;
  onClickPassword: () => void;
};

// Lv2.
export const AuthBlock = ({ user, onClickPassword }: Prop) => {
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [, confirmModal] = useConfirmModal();
  const closeModal = async () => {
    if (
      await confirmModal('QRコードのスキャンは完了しましたか？', {
        affirm: '完了したので閉じる',
        denial: 'まだ',
      })
    ) {
      setQrcode(null);
    }
  };
  const button = user.isEnabled2FA ? (
    <Disable2FAButton />
  ) : (
    <Enable2FAButton onSucceeded={setQrcode} />
  );
  return (
    <div className="flex flex-col">
      <Modal closeModal={closeModal} isOpen={!!qrcode}>
        {qrcode && <QrcodeCard qrcode={qrcode} onClose={closeModal} />}
      </Modal>
      <FTH3 className="flex min-w-0 flex-row items-center p-[4px] text-xl font-bold">
        Authentication & Security
      </FTH3>
      <div className="flex flex-col items-stretch justify-center gap-4 p-4">
        <div className="flex flex-row items-center justify-center gap-2">
          <div className="basis-[12em] text-center">パスワード</div>
          <div className="basis-[8em] text-center">
            <FTButton onClick={onClickPassword}>変更する</FTButton>
          </div>
        </div>

        <div className="flex flex-row items-center justify-center gap-2">
          <div className="basis-[12em] text-center">
            二要素認証を
            {user.isEnabled2FA ? (
              <p className="inline-block w-[5em] font-bold text-green-400">
                利用する
              </p>
            ) : (
              <p className="inline-block w-[5em] text-gray-300">利用しない</p>
            )}
          </div>
          <div className="basis-[8em] text-center">{button}</div>
        </div>
      </div>
    </div>
  );
};
