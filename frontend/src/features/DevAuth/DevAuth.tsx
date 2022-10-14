import { FTH1, FTH3 } from '@/components/FTBasicComponents';
import { useStoredCredential } from '@/hooks';
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export const DevAuthLogin = () => {
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        Login
      </FTH1>
      <br></br>
      <div className="flex flex-col gap-6">
        <FTH3>By 42</FTH3>
        <div>
          <form method="POST" action="http://localhost:3000/auth/login_ft">
            <input type="submit" value="Login" />
          </form>
        </div>
        <FTH3>By Self</FTH3>
      </div>
    </>
  );
};

export const DevAuthLogout = () => {
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        Logout
      </FTH1>
    </>
  );
};

export const DevAuthValidating = () => {
  return <>クレデンシャルを検証しています...</>;
};

const apiHost = `http://localhost:3000`;

type AuthenticationFlowState =
  | 'Neutral'
  | 'Validating'
  | 'Authenticated'
  | 'NotAuthenticated'
  | 'NeutralAuthorizationCode'
  | 'ValidatingAuthorizationCode';

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
    // query.delete("code");
    console.log({ code });
    return [code, 'NeutralAuthorizationCode'] as const;
  })();
  const [authState, setAuthState] =
    useState<AuthenticationFlowState>(initialFlowState);
  // ブラウザが保持しているクレデンシャル
  const [storedCredential, setStoredCredential] = useStoredCredential();
  // 認可コード
  const [ftAuthCode, setFtAuthCode] = useState(initialAuthCode);

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
        console.log(json);
        setAuthState('Authenticated');
        return;
      } catch (e) {
        console.error(e);
        setAuthState('NotAuthenticated');
      }
    } else {
      setAuthState('NotAuthenticated');
    }
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

  const com = (() => {
    switch (authState) {
      case 'Neutral':
      case 'Validating':
        return DevAuthValidating();
      case 'Authenticated':
        return DevAuthLogout();
      case 'NotAuthenticated':
        return DevAuthLogin();
      case 'NeutralAuthorizationCode':
      case 'ValidatingAuthorizationCode':
        return DevAuthValidating();
      default:
        return <div>(default)</div>;
    }
  })();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="w-96 basis-1 border-4 border-white">{com}</div>
    </div>
  );
};
