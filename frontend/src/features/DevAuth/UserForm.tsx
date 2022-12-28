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
import { Icons } from '@/icons';
import { UserPersonalData } from '@/stores/auth';
import * as TD from '@/typedef';
import { omitBy } from '@/utils';
import { DisplayNamePolicy, PasswordPolicy } from '@/validator/user.validator';

import { popAuthError } from '../Toaster/toast';
import { AvatarFile, AvatarInput } from '../User/components/AvatarInput';
import { userErrors } from '../User/user.validator';

type Prop = {
  onClose: (user?: TD.User, access_token?: string) => void;
};

type InnerProp = Prop & {
  userData?: UserPersonalData;
};

export const UserForm = ({ userData, onClose }: InnerProp) => {
  const mode = userData ? 'Update' : 'Create';
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<AvatarFile | null>(null);
  const submitId = useId();
  const [nameId, emailId, passwordId] = [useId(), useId(), useId()];
  const fieldIds: string[] = [];
  fieldIds.push(nameId);
  if (mode === 'Create') {
    fieldIds.push(emailId);
  }
  fieldIds.push(passwordId);

  const trimmedData = {
    displayName: displayName.trim(),
    email: email.trim(),
    password: password.trim(),
    avatar: avatarFile?.dataURL,
  };

  const validationErrors = userErrors(mode, trimmedData);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const method = mode === 'Create' ? 'POST' : 'PATCH';
  const [state, submit] = useAPI(method, `/me`, {
    payload: () => omitBy(trimmedData, (v) => !!v),
    onFetched: (json) => {
      const { user, access_token } = json as {
        user: TD.User;
        access_token: string;
      };
      setNetErrors({});
      onClose(user, access_token);
    },
    onFailed(e) {
      if (e instanceof TypeError) {
        popAuthError('ネットワークエラー');
      } else if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          if (typeof json === 'object') {
            setNetErrors(json);
          }
        });
        popAuthError('サーバエラー');
      }
    },
  });
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
  const title = mode === 'Create' ? 'Register Your Data' : 'Modify Your Data';
  const headerBlock =
    mode === 'Create' ? null : (
      <div className="p-4 text-center text-sm">
        あなたの現在の登録情報です。必要ならば修正してください。
      </div>
    );
  const idBlock = userData ? (
    <>
      <FTH4>id</FTH4>
      <p className=" pt-1 pr-1 pb-4">{userData.id}</p>
    </>
  ) : null;
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
  const submitContent =
    mode === 'Create' ? <>この内容で登録</> : <>修正して保存</>;
  const passwordPlaceholder =
    mode === 'Create'
      ? `${PasswordPolicy.min} - ${PasswordPolicy.max} 文字`
      : `設定する場合は ${PasswordPolicy.min} - ${PasswordPolicy.max} 文字`;
  return (
    <>
      <FTH1 className="p-2 text-3xl">{title}</FTH1>
      {headerBlock}
      <div className="flex">
        <div className="flex shrink-0 grow-0 flex-col">
          <FTH4>
            <span className="pl-4">avatar</span>
          </FTH4>
          <AvatarInput
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            networkError={netErrors.avatar}
          />
        </div>

        <div className="shrink grow overflow-hidden">
          {idBlock}

          <FTH4 className="">name</FTH4>
          <div className="py-1 pb-5">
            <FTTextField
              id={nameId}
              name="displayName"
              className="w-full border-0 border-b-2 focus:bg-gray-700"
              autoComplete="off"
              placeholder={`${DisplayNamePolicy.min} - ${DisplayNamePolicy.max} 文字`}
              value={displayName}
              onActualKeyDown={moveFocus}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="text-red-400">
              {validationErrors.displayName || netErrors.displayName || '　'}
            </div>
          </div>

          <form id="userSignUpForm">
            <FTH4>email</FTH4>
            <div className="overflow-hidden truncate py-1 pr-1">
              <FTTextField
                id={emailId}
                name="email"
                className="w-full border-0 border-b-2 focus:bg-gray-700 disabled:border-b-0"
                autoComplete="username"
                value={userData ? userData.email : email}
                onActualKeyDown={moveFocus}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!userData}
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
                autoComplete="new-password"
                placeholder={passwordPlaceholder}
                value={password}
                type="password"
                onActualKeyDown={moveFocus}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="h-[2em]">{passwordErrorContent()}</div>
            </div>
          </form>
        </div>
      </div>
      <div className="flex justify-around p-4">
        <FTButton
          className="mr-2 disabled:opacity-50"
          onClick={() => onClose()}
        >
          キャンセル
        </FTButton>
        <FTButton
          id={submitId}
          className="mr-2 disabled:opacity-50"
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          <InlineIcon i={<Icons.Save />} />
          {submitContent}
        </FTButton>
      </div>
    </>
  );
};
