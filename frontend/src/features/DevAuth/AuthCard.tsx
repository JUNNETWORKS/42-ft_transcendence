import { authAtom } from '@/stores/auth';
import { urlLoginFt } from './auth';
import {
  FTH1,
  FTH3,
  FTH4,
  FTButton,
  FTSubmit,
  FTTextField,
  FTH2,
} from '@/components/FTBasicComponents';
import { useAPI } from '@/hooks';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { passwordErrors, selfErrors, totpErrors } from './auth.validator';
import { APIError } from '@/errors/APIError';

/**
 * TOTP入力フォーム
 */
export const TotpAuthForm = (props: {
  token2FA: string;
  onSucceeded: (token: string, user: any, required2fa: boolean) => void;
  onClose: () => void;
}) => {
  const [otp, setOtp] = useState('');
  const [state, submit] = useAPI('POST', `/auth/otp`, {
    credential: { token: props.token2FA },
    payload: () => ({ otp }),
    onFetched(json) {
      const { access_token: token, user, required2fa } = json as any;
      props.onSucceeded(token, user, required2fa);
    },
    onFailed(e) {
      if (e instanceof APIError) {
        switch (e.response.status) {
          case 401:
            setNetErrors({ totp: 'パスワードが違います' });
            return;
          default:
            setNetErrors({ totp: '認証に失敗しました' });
            return;
        }
      }
    },
  });
  const validationErrors = totpErrors(otp);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  return (
    <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
      <h3>ワンタイムパスワード入力</h3>
      <ul className="list-disc">
        <li>
          お使いのスマートフォンにて Google Authenticator アプリを起動し,
          表示されるワンタイムパスワードを入力してください。
        </li>
      </ul>
      <div>
        <FTTextField
          className="w-full"
          value={otp}
          placeholder="ワンタイムパスワード"
          onChange={(e) => setOtp(e.target.value)}
        />
        <div className="text-red-400">
          {validationErrors.totp || netErrors.totp || '　'}
        </div>
      </div>
      <div>
        <FTButton
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          Login
        </FTButton>
      </div>
    </div>
  );
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
  onSucceeded: (token: string, user: any, required2fa: boolean) => void;
  onFailed: () => void;
}) => {
  const [userIdStr, setUserIdStr] = useState('');
  const errors = selfErrors(userIdStr);
  const [state, submit] = useAPI('GET', `/auth/self/${userIdStr}`, {
    onFetched(json) {
      const { access_token: token, user, required2fa } = json as any;
      props.onSucceeded(token, user, required2fa);
    },
    onFailed(error) {
      props.onFailed();
    },
  });

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
        disabled={!!errors.some || state === 'Fetching'}
        onClick={submit}
      >
        Force Login
      </FTButton>
      <div>{errors.userIdStr}</div>
    </>
  );
};

/**
 * メアド+パスワード認証
 */
const PasswordAuthForm = (props: {
  onSucceeded: (token: string, user: any, required2fa: boolean) => void;
  onFailed: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const errors = passwordErrors(email, password);
  const [state, submit] = useAPI('POST', '/auth/login', {
    payload: () => ({ email, password }),
    onFetched(json) {
      const { access_token: token, user, required2fa } = json as any;
      props.onSucceeded(token, user, required2fa);
    },
    onFailed(error) {
      props.onFailed();
    },
  });

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
        <div>{errors.email || '　'}</div>
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
        <div>{errors.password || '　'}</div>
      </div>
      <div>
        <FTButton
          disabled={errors.some && state === 'Fetching'}
          onClick={submit}
        >
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
  onSucceeded: (token: string, user: any, required2fa: boolean) => void;
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
