import { useAtom } from 'jotai';
import { useState } from 'react';
import { Oval } from 'react-loader-spinner';

import {
  FTH1,
  FTH3,
  FTH4,
  FTButton,
  FTSubmit,
  FTTextField,
} from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { OtpInput } from '@/features/DevAuth/components/OtpInput';
import { useAPI } from '@/hooks';
import { authAtom } from '@/stores/auth';
import { useUserSignupForm } from '@/stores/control';

import { popAuthError, popAuthInfo } from '../Toaster/toast';
import { urlLoginFt } from './auth';
import { passwordErrors, selfErrors } from './auth.validator';
import { useOtp } from './hooks/useOtp';

/**
 * TOTP入力フォーム
 */
export const TotpAuthForm = (props: {
  token2FA: string;
  onSucceeded: (token: string, user: any, required2fa: boolean) => void;
  onClose: () => void;
}) => {
  const otpLength = 6;
  const [otpString, otpArray, setOtp] = useOtp(otpLength);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const [state, submitNothing, , submit] = useAPI('POST', `/auth/otp`, {
    credential: { token: props.token2FA },
    payload: () => ({ otp: otpString }),
    onFetched(json) {
      const { access_token: token, user, required2fa } = json as any;
      props.onSucceeded(token, user, required2fa);
    },
    onFailed(e) {
      if (e instanceof TypeError) {
        popAuthError('ネットワークエラー');
      } else if (e instanceof APIError) {
        switch (e.response.status) {
          case 401:
            setNetErrors({
              totp: '認証に失敗しました。もう一度お試しください。',
            });
            break;
          default:
            setNetErrors({ totp: '認証に失敗しました' });
            break;
        }
      }
    },
  });

  return (
    <div className="flex w-[480px] flex-col justify-around gap-5 bg-primary p-8">
      <h3>ワンタイムパスワード入力</h3>
      <ul className="list-disc">
        <li>
          お使いのスマートフォンにて Google Authenticator アプリを起動し,
          表示されるワンタイムパスワードを入力してください。
        </li>
      </ul>
      <div className="relative grid">
        <div className="absolute z-10 place-self-center">
          <Oval
            height={40}
            width={40}
            color="#ffffff"
            visible={state === 'Fetching'}
            secondaryColor="#eeeeee"
          />
        </div>
        <OtpInput
          otpLength={otpLength}
          otpArray={otpArray}
          submit={(otpString: string) =>
            submit({ payload: { otp: otpString } })
          }
          setOtp={setOtp}
        ></OtpInput>
      </div>
      <div className="text-red-400">{netErrors.totp || '　'}</div>
      <div>
        <FTButton
          disabled={otpString.length !== otpLength || state === 'Fetching'}
          onClick={submitNothing}
        >
          Login
        </FTButton>
      </div>
    </div>
  );
};

const SignUpForm = () => {
  const [, setOpen] = useUserSignupForm();
  return <FTButton onClick={() => setOpen(true)}>Sign Up</FTButton>;
};

/**
 * 42認証用のフォーム
 * ボタンが1つあるだけ
 */
const FtAuthForm = () => (
  <form method="POST" action={urlLoginFt}>
    <FTSubmit
      className="cursor-pointer hover:bg-white hover:text-black"
      value="Login"
    />
  </form>
);

/**
 * メアド+パスワード認証
 */
const PasswordAuthForm = (props: {
  onSucceeded: (token: string, user: any, required2fa: boolean) => void;
  onFailed: () => void;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const validationErrors = passwordErrors(email, password);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const [state, submit] = useAPI('POST', '/auth/login', {
    payload: () => ({ email, password }),
    onFetched(json) {
      const { access_token: token, user, required2fa } = json as any;
      setNetErrors({});
      props.onSucceeded(token, user, required2fa);
    },
    onFailed(error) {
      if (error instanceof TypeError) {
        // ネットワークエラー
        popAuthError('ネットワークエラーです');
        setNetErrors({ api: 'ネットワークエラー' });
      } else if (error instanceof APIError) {
        // サーバエラー
        popAuthError(error.messageForUser);
        setNetErrors({ api: error.messageForUser });
      }
      props.onFailed();
    },
  });

  return (
    <div className="grid grid-flow-row justify-center">
      <form id="signInForm">
        <div>
          <FTTextField
            className="border-2"
            autoComplete="username"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>{validationErrors.email || netErrors.email || '　'}</div>
        </div>
        <div>
          <FTTextField
            className="border-2"
            autoComplete="current-password"
            placeholder="パスワード"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>{validationErrors.password || netErrors.password || '　'}</div>
        </div>
      </form>
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
      <div className="flex flex-col gap-6">
        <FTH3 className="sticky top-0 z-10">Sign Up</FTH3>
        <div className="text-center">
          <SignUpForm />
        </div>

        <FTH3 className="sticky top-0 z-10">By 42Auth</FTH3>
        <div className="text-center">
          <FtAuthForm />
        </div>

        <FTH3 className="sticky top-0 z-10">By Email / Password</FTH3>
        <div>
          <PasswordAuthForm
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
              popAuthInfo('ログアウトしました');
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
