import {
  FTH1,
  FTH3,
  FTH4,
  FTButton,
  FTSubmit,
  FTTextField,
} from '@/components/FTBasicComponents';
import { useState } from 'react';

const apiHost = `http://localhost:3000`;

export type UserPersonalData = {
  id: number;
  email: string;
  displayName: string;
};

const FtAuthForm = () => (
  <form method="POST" action={`${apiHost}/auth/login_ft`}>
    <FTSubmit className="hover:bg-white hover:text-black" value="Login" />
  </form>
);

const SelfAuthForm = (props: {
  finalizer: (token: string, user: any) => void;
}) => {
  const [userIdStr, setUserIdStr] = useState('');
  type Phase = 'Ready' | 'NotReady' | 'Working';
  // 状態遷移
  // - ボタン押せる
  // - ボタン押せない
  // - ボタン押してる
  const [phase, setPhase] = useState<Phase>('NotReady');

  const sender = async (s: string) => {
    const url = `${apiHost}/auth/self/${s}`;
    const result = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });
    if (result.ok) {
      const json = await result.json();
      console.log('json', json);
      const { token, user } = json;
      props.finalizer(token, user);
    }
  };

  const validator = (s: string) => {
    if (!s) {
      return 'empty?';
    }
    const n = parseInt(s);
    if (`${n}` !== s) {
      return 'not a valid number?';
    }
    if (n < 1) {
      return 'not a valid userId?';
    }
    return null;
  };

  const click = async () => {
    try {
      setPhase('Working');
      await sender(userIdStr);
    } catch (e) {
      console.error(e);
    }
    setPhase('Ready');
  };

  const errorMessage = (() => {
    if (phase === 'Working') {
      return null;
    }
    return validator(userIdStr);
  })();

  return (
    <>
      <FTTextField
        className="border-2"
        autoComplete="off"
        placeholder="ユーザID"
        value={userIdStr}
        onChange={(e) => setUserIdStr(e.target.value)}
      />
      <FTButton disabled={!!errorMessage} onClick={() => click()}>
        Force Login
      </FTButton>
      <div>{errorMessage}</div>
    </>
  );
};

export const DevAuthLogin = (props: {
  finalizer: (token: string, user: any) => void;
}) => {
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        Login, Please.
      </FTH1>
      <br />
      <div className="flex flex-col gap-8">
        <FTH3>By 42Auth</FTH3>
        <div className="text-center">
          <FtAuthForm />
        </div>
        <FTH3>By Self</FTH3>
        <div className="text-center">
          <SelfAuthForm finalizer={props.finalizer} />
        </div>
        <FTH3>By Email / Password</FTH3>
        <div></div>
      </div>
    </>
  );
};

export const DevAuthenticated = (props: {
  personalData: UserPersonalData;
  onLogout?: () => void;
}) => {
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        You&apos;re Authenticated.
      </FTH1>
      <div className="flex flex-col gap-2">
        <FTH4>id</FTH4>
        <div>{props.personalData.id}</div>
        <FTH4>name</FTH4>
        <div>{props.personalData.displayName}</div>
        <FTH4>email</FTH4>
        <div>{props.personalData.email}</div>
      </div>
      <br />
      <div className="flex flex-col gap-2">
        <FTH4>Logout?</FTH4>
        <div className="text-center">
          <FTButton
            onClick={() => {
              if (props.onLogout) props.onLogout();
            }}
          >
            Logout
          </FTButton>
        </div>
      </div>
    </>
  );
};

export const DevAuthValidating = () => {
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        Just A Moment, Please.
      </FTH1>
      <div>クレデンシャルを検証しています...</div>
    </>
  );
};
