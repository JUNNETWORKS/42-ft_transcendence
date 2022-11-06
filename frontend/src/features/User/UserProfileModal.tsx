import { authAtom } from '@/stores/auth';
import { useUpdateUser } from '@/stores/store';
import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { displayNameErrors } from './user.validator';
import { Modal } from '@/components/Modal';
import { useDropzone } from 'react-dropzone';

type Phase = 'Display' | 'Edit' | '' | 'Edit2FA' | 'EditPassword';

type Prop = {
  user: TD.User;
  onClose: () => void;
};

type InnerProp = Prop & {
  setPhase: (phase: Phase) => void;
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
        <p className="block p-2">インストール:</p>
        <a
          className="block p-2 underline"
          target="_blank"
          rel="noopener noreferrer"
          href={urlGA.play}
        >
          Google Play
        </a>
        <a
          className="block p-2 underline"
          target="_blank"
          rel="noopener noreferrer"
          href={urlGA.play}
        >
          App Store
        </a>
      </div>
      <div className="text-center">
        <img className="inline" src={props.qrcode} />
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
  if (!personalData) {
    return null;
  }
  return (
    <div>
      <p>Enabled.</p>

      <FTButton
        className="mr-2 disabled:opacity-50"
        disabled={state === 'Fetching'}
        onClick={() => {
          if (confirm('really disable 2FA?')) {
            submit();
          }
        }}
      >
        Disable 2FA
      </FTButton>
    </div>
  );
};

type Enable2FACardProp = { onSucceeded: (qrcode: string) => void };

/**
 * 二要素認証を有効化するためのコンポーネント
 */
const Enable2FACard = ({ onSucceeded }: Enable2FACardProp) => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [state, submit] = useAPI('PATCH', `/me/twoFa/enable`, {
    onFetched: (json) => {
      const data = json as { qrcode: string };
      setPersonalData({ ...personalData!, isEnabled2FA: true });
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
  if (!personalData) {
    return null;
  }
  return (
    <div>
      <p>Disabled.</p>

      <FTButton
        className="mr-2 disabled:opacity-50"
        disabled={state === 'Fetching'}
        onClick={() => {
          if (confirm('really enable 2FA?')) {
            submit();
          }
        }}
      >
        Enable 2FA
      </FTButton>
    </div>
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

  if (!personalData) {
    return null;
  }
  const closeModal = () => {
    if (confirm('QRコードのスキャンは完了しましたか？')) {
      setQrcode(null);
    }
  };
  return (
    <>
      <Modal closeModal={closeModal} isOpen={!!qrcode}>
        {qrcode && <QrcodeCard qrcode={qrcode} onClose={closeModal} />}
      </Modal>
      <div className="flex gap-8">
        <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" />
        <div className="flex flex-col justify-around">
          <div className="text-2xl">Id: {user.id}</div>
          <div className="text-2xl">{displayName}</div>
          <h3 className="text-2xl">2FA</h3>
          {personalData.isEnabled2FA ? (
            <Disable2FACard />
          ) : (
            <Enable2FACard onSucceeded={setQrcode} />
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

const convertBlobToDataURL = (blob: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(undefined);
    };
    reader.readAsDataURL(blob);
  });

const EditAttribute = ({ user, setPhase, onClose }: InnerProp) => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarFileDataURL, setAvatarFileDataURL] = useState<string | null>(
    null
  );
  const validationErrors = displayNameErrors(displayName);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const { updateOne } = useUpdateUser();
  const [state, submit] = useAPI('PATCH', `/me`, {
    payload: () => ({ displayName, avatar: avatarFileDataURL }),
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
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
    if (acceptedFiles.length !== 1) {
      return;
    }
    convertBlobToDataURL(acceptedFiles[0]).then((dataURL) => {
      console.log('dataURL', dataURL);
      setAvatarFileDataURL(dataURL);
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
    },
    maxFiles: 1,
    maxSize: 1024 ** 2,
    onDrop,
  });
  return (
    <>
      <div className="flex gap-8">
        <div
          {...getRootProps()}
          className="h-[120px] w-[120px] border-[1px] border-dotted border-white"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag and drop some files here, or click to select files</p>
          )}
          ({avatarFileDataURL ? avatarFileDataURL : ''})
        </div>

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
      <div className="flex gap-8">
        <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" />
        <div className="flex flex-col justify-around">
          <p className="text-2xl">Id: {user.id}</p>
          <p className="text-2xl">Name: {user.displayName}</p>
        </div>
      </div>
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
        <FTButton
          className="w-36"
          onClick={() => {
            navigation('/auth');
            onClose();
          }}
        >
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
        return null;
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
