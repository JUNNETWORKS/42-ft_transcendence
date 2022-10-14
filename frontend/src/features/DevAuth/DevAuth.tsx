import {
  FTH1,
  FTH3,
  FTH4,
  FTButton,
  FTSubmit,
  FTTextField,
} from '@/components/FTBasicComponents';
import { useQuery, useStoredCredential } from '@/hooks';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const apiHost = `http://localhost:3000`;

const FtAuthForm = () => (
  <form method="POST" action="http://localhost:3000/auth/login_ft">
    <FTSubmit className="hover:bg-white hover:text-black" value="Login" />
  </form>
);

const SelfAuthForm = (props: { finalizer: (data: any) => void }) => {
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
    const json = await result.json();
    console.log('json', json);
    props.finalizer(json);
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

export const DevAuthLogin = (props: { finalizer: (data: any) => void }) => {
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

type AuthenticationFlowState =
  | 'Neutral'
  | 'Validating'
  | 'Authenticated'
  | 'NotAuthenticated'
  | 'NeutralAuthorizationCode'
  | 'ValidatingAuthorizationCode';
type UserPersonalData = {
  id: number;
  email: string;
  displayName: string;
};

let i = 0;

export const DevAuth = () => {
  const query = useQuery();
  const navigation = useNavigate();
  const j = i++;
  // 認証フローの状態
  const [initialAuthCode, initialFlowState] = (() => {
    const code = query.get('code');
    console.log(j, { code });
    if (!code || typeof code !== 'string') {
      return ['', 'Neutral'] as const;
    }
    // 認可コードがある -> 認可コードを検証!!
    return [code, 'NeutralAuthorizationCode'] as const;
  })();
  const [authState, setAuthState] =
    useState<AuthenticationFlowState>(initialFlowState);
  // ブラウザが保持しているクレデンシャル
  const [storedCredential, setStoredCredential] = useStoredCredential();
  // 認可コード
  const [ftAuthCode] = useState(initialAuthCode);
  // パーソナルデータ
  const [personalData, setPersonalData] = useState<UserPersonalData | null>(
    null
  );

  const callSession = async () => {
    console.log({ storedCredential });
    if (storedCredential && storedCredential.token) {
      console.log(`calling callSession`);
      try {
        const result = await fetch(`${apiHost}/auth/session`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            Authorization: `Bearer ${storedCredential.token}`,
          },
        });
        const json = await result.json();
        console.log('callSession', json);
        if (json) {
          setPersonalData(json);
          setAuthState('Authenticated');
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setPersonalData(null);
    setAuthState('NotAuthenticated');
  };

  const callCallbackFt = async () => {
    const url = `${apiHost}/auth/callback_ft?code=${ftAuthCode}`;
    console.log(`calling callCallbackFt`, url);
    const result = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {},
    });
    const { access_token, user } = (await result.json()) || {};
    if (access_token && typeof access_token === 'string') {
      // アクセストークンが得られた
      // -> 認証完了状態にする
      setStoredCredential({ token: access_token });
      setPersonalData(user);
      setAuthState('Authenticated');
    } else {
      // アクセストークンがなかった
      // クレデンシャルを破棄する
      setStoredCredential(null);
      setAuthState('NotAuthenticated');
    }
  };

  // 認証状態のチェック
  useEffect(() => {
    console.log(`authState[${j}]`, authState);
    switch (authState) {
      case 'Neutral': {
        // [検証中]
        // -> 保存されてる
        setAuthState('Validating');
        break;
      }
      case 'Validating':
        callSession();
        break;
      case 'NotAuthenticated':
        // [未認証]
        // -> ログインUIを表示
        break;
      case 'NeutralAuthorizationCode': {
        // [認可コード検証]
        // -> 認可コード検証APIをコール
        if (!ftAuthCode || typeof ftAuthCode !== 'string') {
          break;
        }
        navigation('/auth', { replace: true });
        setAuthState('ValidatingAuthorizationCode');
        break;
      }
      case 'ValidatingAuthorizationCode': {
        callCallbackFt();
        break;
      }
    }
  }, [authState]);

  const doLogout = () => {
    setStoredCredential(null);
    setAuthState('NotAuthenticated');
  };

  const finalizer = (data: any) => {
    const { token, user } = data;
    setStoredCredential({ token });
    setPersonalData(user);
    setAuthState('Authenticated');
  };

  const presentator = (() => {
    switch (authState) {
      case 'Neutral':
      case 'Validating':
        return DevAuthValidating();
      case 'Authenticated':
        return DevAuthenticated({
          personalData: personalData!,
          onLogout: doLogout,
        });
      case 'NotAuthenticated':
        return DevAuthLogin({ finalizer });
      case 'NeutralAuthorizationCode':
      case 'ValidatingAuthorizationCode':
        return DevAuthValidating();
      default:
        return <div>(default)</div>;
    }
  })();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        {presentator}
      </div>
    </div>
  );
};
