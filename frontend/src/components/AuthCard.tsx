import { userAtoms } from '@/atoms';
import { loginByPassword, loginBySelf, urlLoginFt } from '@/auth';
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

  const validateUserIdStr = (s: string) => {
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
    return validateUserIdStr(userIdStr);
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
 * メアド+パスワード認証
 */
const PasswordAuthForm = (props: {
  onSucceeded: (token: string, user: any) => void;
  onFailed: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  type Phase = 'Ready' | 'NotReady' | 'Working';
  // 内部状態
  // - ボタン押せる
  // - ボタン押せない
  // - ボタン押してる
  const [phase, setPhase] = useState<Phase>('NotReady');

  const validateEmail = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed) {
      return 'empty?';
    }
    const emailRegExp = /^[^@]+?@[^@]+$/;
    const m = trimmed.match(emailRegExp);
    if (!m) {
      return 'not a valid email?';
    }
    return null;
  };
  const validatePassword = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed) {
      return 'empty?';
    }
    return null;
  };

  const click = async () => {
    try {
      setPhase('Working');
      await loginByPassword(email, password, props.onSucceeded, props.onFailed);
    } catch (e) {
      console.error(e);
    }
    setPhase('Ready');
  };

  const emailErrorMessage = (() => {
    if (phase === 'Working') {
      return null;
    }
    return validateEmail(email);
  })();
  const passwordErrorMessage = (() => {
    if (phase === 'Working') {
      return null;
    }
    return validatePassword(password);
  })();

  const isClickable = !!emailErrorMessage || !!passwordErrorMessage;

  return (
    <div className="grid grid-flow-row justify-center">
      <div>
        <FTTextField
          className="border-2"
          autoComplete="off"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>{emailErrorMessage || '　'}</div>
      </div>
      <div>
        <FTTextField
          className="border-2"
          autoComplete="off"
          placeholder="パスワード"
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div>{passwordErrorMessage || '　'}</div>
      </div>
      <div>
        <FTButton disabled={isClickable} onClick={click}>
          Login
        </FTButton>
      </div>
    </div>
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

        <FTH3>By Email / Password</FTH3>
        <div>
          <PasswordAuthForm
            onSucceeded={props.onSucceeded}
            onFailed={props.onFailed}
          />
        </div>

        <FTH3>By Self</FTH3>
        <div className="text-center">
          <SelfAuthForm
            onSucceeded={props.onSucceeded}
            onFailed={props.onFailed}
          />
        </div>
      </div>
    </>
  );
};

/**
 * 認証済み状態で表示されるUI
 */
export const DevAuthenticatedCard = (props: { onLogout?: () => void }) => {
  const [personalData] = useAtom(userAtoms.personalDataAtom);
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