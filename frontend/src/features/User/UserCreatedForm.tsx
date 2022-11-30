import { authAtom, UserPersonalData } from '@/stores/auth';
import { useUpdateUser } from '@/stores/store';
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
import * as TD from '@/typedef';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { userErrors } from './user.validator';
import { AvatarFile, AvatarInput } from './components/AvatarInput';

type Prop = {
  onClose: () => void;
};

type InnerProp = Prop & {
  userData: UserPersonalData;
  setUserData: (userData: UserPersonalData) => void;
};

const EditCard = ({ userData, setUserData, onClose }: InnerProp) => {
  const [displayName, setDisplayName] = useState(userData.displayName);
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<AvatarFile | null>(null);
  const validationErrors = {
    ...userErrors(displayName, password),
  };
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const { updateOne } = useUpdateUser();
  const [state, submit] = useAPI('PATCH', `/me`, {
    payload: () => ({ displayName, avatar: avatarFile?.dataURL }),
    onFetched: (json) => {
      const u = json as TD.User;
      updateOne(u.id, u);
      setUserData({ ...userData, ...u, avatarTime: Date.now() });
      setNetErrors({});
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
    if (password.length > 0) {
      return (
        <>
          <span className="text-green-400">
            <InlineIcon i={<Icons.Ok />} />
          </span>
          {password.length}/60
        </>
      );
    }
    return <></>;
  };
  return (
    <>
      <FTH1 className="p-2 text-3xl">Modify Your Data</FTH1>
      <div className="p-4 text-center text-sm">
        あなたの現在の登録情報です。必要ならば修正してください。
      </div>
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
          <FTH4>id</FTH4>
          <p className=" pt-1 pr-1 pb-4">{userData.id}</p>

          <FTH4 className="">name</FTH4>
          <div className="py-1 pr-2">
            <FTTextField
              name="displayName"
              className="w-full border-0 border-b-2"
              autoComplete="off"
              placeholder="Name:"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="text-red-400">
              {validationErrors.displayName || netErrors.displayName || '　'}
            </div>
          </div>

          <FTH4>email</FTH4>
          <div className="overflow-hidden truncate py-1 pr-1">
            {userData.email}
          </div>

          <FTH4 className="">password</FTH4>
          <div className="py-1 pr-2">
            <FTTextField
              name="password"
              className="w-full border-0 border-b-2"
              autoComplete="off"
              placeholder="設定する場合は 12 - 60 文字"
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="h-[2em]">{passwordErrorContent()}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-around p-4">
        <FTButton className="mr-2 disabled:opacity-50" onClick={onClose}>
          あとにする
        </FTButton>
        <FTButton
          className="mr-2 disabled:opacity-50"
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          <InlineIcon i={<Icons.Save />} />
          修正して保存
        </FTButton>
      </div>
    </>
  );
};

export const UserCreatedForm = ({ onClose }: Prop) => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  if (!personalData) {
    return null;
  }
  return (
    <>
      <div className="flex w-[480px] flex-col justify-around border-4 border-white bg-black">
        <EditCard
          userData={personalData}
          setUserData={(u) => setPersonalData(u)}
          onClose={onClose}
        />
      </div>
    </>
  );
};
