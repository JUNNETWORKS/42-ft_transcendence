import { useState } from 'react';
import { useId } from 'react';

import {
  FTButton,
  FTH1,
  FTH4,
  FTTextField,
} from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { usePersonalData } from '@/hooks/usePersonalData';
import { Icons } from '@/icons';
import { useLoginLocal, UserPersonalData } from '@/stores/auth';
import { useUpdateUser } from '@/stores/store';
import * as TD from '@/typedef';

import { popAuthError, popAuthImportantInfo } from '../Toaster/toast';
import { AvatarFile, AvatarInput } from './components/AvatarInput';
import { userCreateErrors } from './user.validator';

type Prop = {
  onClose: () => void;
};

type InnerProp = Prop;

const RegisterCard = ({ onClose }: InnerProp) => {
  const loginLocal = useLoginLocal();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<AvatarFile | null>(null);
  const submitId = useId();
  const fieldIds = [useId(), useId(), useId()];
  const [nameId, emailId, passwordId] = fieldIds;

  const trimmedData = {
    displayName: displayName.trim(),
    email: email.trim(),
    password: password.trim(),
    avatarFile,
  };

  const validationErrors = {
    ...userCreateErrors(
      trimmedData.displayName,
      trimmedData.email,
      trimmedData.password
    ),
  };
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const [state, submit] = useAPI('POST', `/me`, {
    payload: () => ({
      displayName: trimmedData.displayName,
      email: trimmedData.email,
      password: trimmedData.password,
      avatar: trimmedData.avatarFile?.dataURL,
    }),
    onFetched: (json) => {
      const { user, access_token } = json as {
        user: TD.User;
        access_token: string;
      };
      console.log(user, access_token);
      setNetErrors({});
      loginLocal(access_token, user);
      popAuthImportantInfo('ユーザ登録が完了しました');
      onClose();
    },
    onFailed(e) {
      if (e instanceof TypeError) {
        popAuthError('ネットワークエラー');
      } else if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
          if (typeof json === 'object') {
            setNetErrors(json);
          }
        });
        popAuthError('サーバエラー');
      }
    },
  });
  const passwordErrorContent = () => {
    const passwordError = validationErrors.password || netErrors.password;
    if (passwordError) {
      return (
        <span className="text-red-400">
          <InlineIcon i={<Icons.Bang />} />
          {passwordError}
        </span>
      );
    }
    if (trimmedData.password.length > 0) {
      return (
        <>
          <span className="text-green-400">
            <InlineIcon i={<Icons.Ok />} />
          </span>
          {trimmedData.password.length}/60
        </>
      );
    }
    return <></>;
  };
  const moveFocus = (e: React.KeyboardEvent<HTMLInputElement>) => {
    let submittable = false;
    let downward: boolean;
    switch (e.key) {
      case 'Enter':
        submittable = true;
        downward = true;
        break;
      case 'ArrowDown':
        downward = true;
        break;
      case 'ArrowUp':
        downward = false;
        break;
      default:
        return;
    }
    const elem = e.target as HTMLElement;
    const cid = elem.id;
    if (cid) {
      const i = fieldIds.indexOf(cid);
      if (i === fieldIds.length - 1 && downward && submittable) {
        document.getElementById(submitId)?.click();
      } else if (i >= 0 && downward) {
        document.getElementById(fieldIds[i + 1])?.focus();
      } else if (i > 0 && !downward) {
        document.getElementById(fieldIds[i - 1])?.focus();
      }
    }
  };
  return (
    <>
      <FTH1 className="p-2 text-3xl">Register Your Data</FTH1>
      <div className="flex">
        <div>
          <FTH4 style={{ paddingLeft: '1em' }}>avatar</FTH4>
          <div className="p-[1em]">
            <AvatarInput
              avatarFile={avatarFile}
              setAvatarFile={setAvatarFile}
              networkError={netErrors.avatar}
            />
          </div>
        </div>
        {/* <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" /> */}

        <div className="shrink grow overflow-hidden">
          <FTH4 className="">name</FTH4>
          <div className="py-1 pb-5">
            <FTTextField
              id={nameId}
              name="displayName"
              className="w-full border-0 border-b-2 focus:bg-gray-700"
              autoComplete="off"
              placeholder="Name:"
              value={displayName}
              onActualKeyDown={moveFocus}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="text-red-400">
              {validationErrors.displayName || netErrors.displayName || '　'}
            </div>
          </div>

          <FTH4>email</FTH4>
          <div className="overflow-hidden truncate py-1 pr-1">
            <FTTextField
              id={emailId}
              name="email"
              className="w-full border-0 border-b-2 focus:bg-gray-700"
              autoComplete="off"
              placeholder="Email:"
              value={email}
              onActualKeyDown={moveFocus}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="text-red-400">
              {validationErrors.email || netErrors.email || '　'}
            </div>
          </div>

          <FTH4 className="">password</FTH4>
          <div className="py-1">
            <FTTextField
              id={passwordId}
              name="password"
              className="w-full border-0 border-b-2 focus:bg-gray-700"
              autoComplete="off"
              placeholder="設定する場合は 12 - 60 文字"
              value={password}
              type="password"
              onActualKeyDown={moveFocus}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="h-[2em]">{passwordErrorContent()}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-around p-4">
        <FTButton className="mr-2 disabled:opacity-50" onClick={onClose}>
          キャンセル
        </FTButton>
        <FTButton
          id={submitId}
          className="mr-2 disabled:opacity-50"
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          <InlineIcon i={<Icons.Save />} />
          この内容で登録
        </FTButton>
      </div>
    </>
  );
};

export const UserRegisterForm = ({ onClose }: Prop) => {
  return (
    <>
      <div className="flex w-[480px] flex-col justify-around border-4 border-white bg-black">
        <RegisterCard onClose={onClose} />
      </div>
    </>
  );
};
