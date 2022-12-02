import { useAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { UserAvatar } from '@/components/UserAvater';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { Icons } from '@/icons';
import { authAtom, useLoginLocal } from '@/stores/auth';
import { useUpdateUser } from '@/stores/store';
import * as TD from '@/typedef';

import { AvatarFile, AvatarInput } from './components/AvatarInput';
import { displayNameErrors, passwordErrors } from './user.validator';


type Phase = 'Display' | 'Edit' | '' | 'Edit2FA' | 'EditPassword';

type Prop = {
  user: TD.User;
  onClose: () => void;
};

type InnerProp = Prop & {
  setPhase: (phase: Phase) => void;
};

const CommonCard = (props: { user: TD.User }) => {
  return (
    <div className="flex gap-8">
      <UserAvatar user={props.user} className="h-24 w-24 shrink-0 grow-0" />
      <div className="flex min-w-0 shrink grow flex-col justify-around">
        <div className="flex flex-row gap-2">
          <p className="shrink-0 grow-0 text-2xl">Id:</p>
          <p className="shrink grow text-2xl">{props.user.id}</p>
        </div>
        <div className="flex flex-row gap-2">
          <p className="shrink-0 grow-0 text-2xl">Name:</p>
          <p
            className="shrink grow overflow-hidden text-ellipsis text-2xl"
            style={{ wordBreak: 'keep-all' }}
          >
            {props.user.displayName}
          </p>
        </div>
      </div>
    </div>
  );
};

const EditPassword = ({ user, setPhase, onClose }: InnerProp) => {
  const [personalData] = useAtom(authAtom.personalData);
  const [password, setPassword] = useState('');
  const loginLocal = useLoginLocal();
  const validationErrors = passwordErrors(password);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const [state, submit] = useAPI('PATCH', `/me/password`, {
    payload: () => ({ password }),
    onFetched: (json) => {
      const data = json as { access_token: string };
      setNetErrors({});
      setPhase('Display');
      loginLocal(data.access_token, personalData);
    },
    onFailed(e) {
      if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
          if (typeof json === 'object') {
            setNetErrors(json);
          }
        });
      }
    },
  });

  if (!personalData) {
    return null;
  }
  const passwordError = validationErrors.password || netErrors.password;
  return (
    <>
      <CommonCard user={user} />
      <div className="flex flex-row items-center justify-center gap-2">
        <div>
          <p className="">新しいパスワード:</p>
          <div className="text-red-400">&nbsp;</div>
        </div>
        <div>
          <FTTextField
            name="password"
            className="w-[16em] border-2"
            autoComplete="off"
            placeholder="12 - 60文字"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError ? (
            <div className="text-red-400">{passwordError}</div>
          ) : (
            <div>{password.length}/60</div>
          )}
        </div>
      </div>
      <div className="flex justify-around gap-8">
        <FTButton
          onClick={() => {
            setPhase('Display');
          }}
        >
          Cancel
        </FTButton>
        <FTButton
          className="mr-2 disabled:opacity-50"
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          <InlineIcon i={<Icons.Save />} />
          Save
        </FTButton>
      </div>
    </>
  );
};

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
          href={urlGA.play}
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
const Disable2FACard = () => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [state, submit] = useAPI('PATCH', `/me/twoFa/disable`, {
    onFinished: () => {
      setPersonalData({ ...personalData!, isEnabled2FA: false });
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
    <>
      <p className="text-xl text-green-400">利用する</p>

      <FTButton
        className="mr-2 disabled:opacity-50"
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
    </>
  );
};

type Enable2FACardProp = { onSucceeded: (qrcode: string) => void };

/**
 * 二要素認証を有効化するためのコンポーネント
 */
const Enable2FACard = ({ onSucceeded }: Enable2FACardProp) => {
  const [personalData] = useAtom(authAtom.personalData);
  const loginLocal = useLoginLocal();
  const [state, submit] = useAPI('PATCH', `/me/twoFa/enable`, {
    onFetched: (json) => {
      const data = json as { access_token: string; qrcode: string };
      loginLocal(data.access_token, { ...personalData!, isEnabled2FA: true });
      onSucceeded(data.qrcode);
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
    <>
      <p>利用しない</p>

      <FTButton
        className="mr-2 disabled:opacity-50"
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
    </>
  );
};

const Edit2FA = ({ user, setPhase, onClose }: InnerProp) => {
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [displayName] = useState(user.displayName);
  const validationErrors = displayNameErrors(displayName);
  const [, setNetErrors] = useState<{ [key: string]: string }>({});
  const { updateOne } = useUpdateUser();
  const [state, submit] = useAPI('PATCH', `/me`, {
    payload: () => ({ displayName }),
    onFetched: (json) => {
      const u = json as TD.User;
      updateOne(u.id, u);
      setPersonalData({ ...personalData!, ...u });
      setNetErrors({});
      setPhase('Display');
    },
    onFailed(e) {
      if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
          if (typeof json === 'object') {
            setNetErrors(json);
          }
        });
      }
    },
  });

  const [, confirmModal] = useConfirmModal();
  if (!personalData) {
    return null;
  }
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
  return (
    <>
      <Modal closeModal={closeModal} isOpen={!!qrcode}>
        {qrcode && <QrcodeCard qrcode={qrcode} onClose={closeModal} />}
      </Modal>
      <CommonCard user={user} />
      <div className="flex flex-row items-center justify-center gap-2">
        <p className="text-2xl">2FA:</p>
        {personalData.isEnabled2FA ? (
          <Disable2FACard />
        ) : (
          <Enable2FACard onSucceeded={setQrcode} />
        )}
      </div>
      <div className="flex justify-around gap-8">
        <FTButton
          onClick={() => {
            setPhase('Display');
          }}
        >
          Back
        </FTButton>
      </div>
    </>
  );
};

/**
 * あまり重要でないユーザ情報(名前, アバター画像)を変更するためのフォーム
 */
const EditAttribute = ({ user, setPhase, onClose }: InnerProp) => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarFile, setAvatarFile] = useState<AvatarFile | null>(null);
  const validationErrors = {
    ...displayNameErrors(displayName),
  };
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const { updateOne } = useUpdateUser();
  const [state, submit] = useAPI('PATCH', `/me`, {
    payload: () => ({ displayName, avatar: avatarFile?.dataURL }),
    onFetched: (json) => {
      const { user: u } = json as { user: TD.User };
      updateOne(u.id, u);
      setPersonalData({ ...personalData!, ...u, avatarTime: Date.now() });
      setNetErrors({});
      setPhase('Display');
    },
    onFailed(e) {
      if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
          if (typeof json === 'object') {
            setNetErrors(json);
          }
        });
      }
    },
  });
  return (
    <>
      <div className="flex gap-8">
        <AvatarInput
          avatarFile={avatarFile}
          setAvatarFile={setAvatarFile}
          networkError={netErrors.avatar}
        />
        {/* <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" /> */}

        <div className="flex flex-col justify-around">
          <div className="text-2xl">Id: {user.id}</div>
          <div className="text-2xl">
            <FTTextField
              className="border-2"
              autoComplete="off"
              placeholder="Name:"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="text-red-400">
              {validationErrors.displayName || netErrors.displayName || '　'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-around gap-8">
        <FTButton
          onClick={() => {
            setPhase('Display');
          }}
        >
          Cancel
        </FTButton>
        <FTButton
          className="mr-2 disabled:opacity-50"
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          <InlineIcon i={<Icons.Save />} />
          Save
        </FTButton>
      </div>
    </>
  );
};

const Display = ({ user, setPhase, onClose }: InnerProp) => {
  const navigation = useNavigate();
  return (
    <>
      <CommonCard user={user} />
      <div className="flex flex-wrap justify-around gap-8">
        <FTButton
          className="w-36"
          onClick={() => {
            navigation('/auth');
            onClose();
          }}
        >
          認証ページ
        </FTButton>
        <FTButton className="w-36" onClick={() => setPhase('Edit')}>
          ユーザ情報変更
        </FTButton>
        <FTButton className="w-36" onClick={() => setPhase('Edit2FA')}>
          2FA設定
        </FTButton>
        <FTButton className="w-36" onClick={() => setPhase('EditPassword')}>
          パスワード変更
        </FTButton>
      </div>
    </>
  );
};

export const UserProfileModal = ({ user, onClose }: Prop) => {
  const [phase, setPhase] = useState<Phase>('Display');
  const presentator = () => {
    switch (phase) {
      case 'Display':
        return <Display user={user} setPhase={setPhase} onClose={onClose} />;
      case 'Edit':
        return (
          <EditAttribute user={user} setPhase={setPhase} onClose={onClose} />
        );
      case 'Edit2FA':
        return <Edit2FA user={user} setPhase={setPhase} onClose={onClose} />;
      case 'EditPassword':
        return (
          <EditPassword user={user} setPhase={setPhase} onClose={onClose} />
        );
    }
  };
  return (
    <>
      <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
        {presentator()}
      </div>
    </>
  );
};
