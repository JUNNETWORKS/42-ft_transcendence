import { personalDataAtom } from '@/atoms';
import { loginBySelf, urlLoginFt } from '@/auth';
import {
  FTH1,
  FTH3,
  FTH4,
  FTButton,
  FTSubmit,
  FTTextField,
} from '@/components/FTBasicComponents';
import { useAtom } from 'jotai';
import { useState } from 'react';

export type UserPersonalData = {
  id: number;
  email: string;
  displayName: string;
};

/**
 * 42認証用のフォーム
 * ボタンが1つあるだけ
 */
const FtAuthForm = () => (
  <form method="POST" action={urlLoginFt}>
    <FTSubmit className="hover:bg-white hover:text-black" value="Login" />
  </form>
);

/**
 * 自己申告認証用のフォーム
 */
const SelfAuthForm = (props: {
  onSucceeded: (token: string, user: any) => void;
  onFailed: () => void;
}) => {
  const [userIdStr, setUserIdStr] = useState('');
  type Phase = 'Ready' | 'NotReady' | 'Working';
  // 内部状態
  // - ボタン押せる
  // - ボタン押せない
  // - ボタン押してる
  const [phase, setPhase] = useState<Phase>('NotReady');

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
      await loginBySelf(userIdStr, props.onSucceeded, props.onFailed);
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

/**
 * 各種認証フォームをまとめたUI
 */
export const DevAuthLoginCard = (props: {
  onSucceeded: (token: string, user: any) => void;
  onFailed: () => void;
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
          <SelfAuthForm
            onSucceeded={props.onSucceeded}
            onFailed={props.onFailed}
          />
        </div>
        <FTH3>By Email / Password</FTH3>
        <div></div>
      </div>
    </>
  );
};

/**
 * 認証済み状態で表示されるUI
 */
export const DevAuthenticatedCard = (props: { onLogout?: () => void }) => {
  const [personalData] = useAtom(personalDataAtom);
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        You&apos;re Authenticated.
      </FTH1>
      {personalData && (
        <div className="flex flex-col gap-2">
          <FTH4>id</FTH4>
          <div>{personalData.id}</div>
          <FTH4>name</FTH4>
          <div>{personalData.displayName}</div>
          <FTH4>email</FTH4>
          <div>{personalData.email}</div>
        </div>
      )}
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

/**
 * 各種検証作業中に表示されるUI
 */
export const DevAuthValidatingCard = () => {
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        Just A Moment, Please.
      </FTH1>
      <div>クレデンシャルを検証しています...</div>
    </>
  );
};
