import { authAtom } from '@/stores/auth';
import { loginByPassword, loginBySelf, urlLoginFt } from './auth';
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
  type Phase = 'Neutral' | 'Fetching';
  const [phase, setPhase] = useState<Phase>('Neutral');

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
      setPhase('Fetching');
      await loginBySelf(userIdStr, props.onSucceeded, props.onFailed);
    } catch (e) {
      console.error(e);
    }
    setPhase('Neutral');
  };

  const errorMessage = validator(userIdStr);

  return (
    <>
      <FTTextField
        className="border-2"
        autoComplete="off"
        placeholder="ユーザID"
        value={userIdStr}
        onChange={(e) => setUserIdStr(e.target.value)}
      />
      <FTButton
        disabled={!!errorMessage || phase === 'Fetching'}
        onClick={() => click()}
      >
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
  type Phase = 'Neutral' | 'Fetching';
  const [phase, setPhase] = useState<Phase>('Neutral');

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
      setPhase('Fetching');
      await loginByPassword(email, password, props.onSucceeded, props.onFailed);
    } catch (e) {
      console.error(e);
    }
    setPhase('Neutral');
  };

  const emailErrorMessage = validateEmail(email);
  const passwordErrorMessage = validatePassword(password);
  const isValid = !emailErrorMessage && !passwordErrorMessage;

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
        <FTButton disabled={!isValid || phase === 'Fetching'} onClick={click}>
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
  const [personalData] = useAtom(authAtom.personalData);
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
