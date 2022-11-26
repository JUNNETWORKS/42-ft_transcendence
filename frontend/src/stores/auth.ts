import { atom, useAtom } from 'jotai';
import { io } from 'socket.io-client';
import {
  AuthenticationFlowState,
  urlChatSocket,
} from '@/features/DevAuth/auth';
import { structureAtom } from './structure';

// 認証情報

type UserPersonalData = {
  id: number;
  email: string;
  displayName: string;
  isEnabled2FA: boolean;
  isEnabledAvatar: boolean;

  avatarTime: number;
};

const actualPersonalDataAtom = atom<UserPersonalData | null>(null);

export const authAtom = {
  authFlowState: atom<AuthenticationFlowState>('Neutral'),
  /**
   * ログインユーザデータのAtom
   */
  personalData: atom(
    (get) => get(actualPersonalDataAtom),
    (get, set, newValue: UserPersonalData | null) => {
      if (newValue) {
        set(actualPersonalDataAtom, { ...newValue, avatarTime: Date.now() });
      } else {
        set(actualPersonalDataAtom, null);
      }
    }
  ),
};

const credentialKey = 'ft_transcendence_credential';
/**
 * ローカルに保存されているクレデンシャルの文字列データのAtom
 */
const storedCredentialStrAtom = atom<string>(
  localStorage.getItem(credentialKey) || ''
);

export type AppCredential = {
  token: string;
};

/**
 * ローカルに保存されているクレデンシャルのオブジェクトデータのAtom
 */
export const storedCredentialAtom = atom(
  (get) => {
    const str = get(storedCredentialStrAtom);
    try {
      const json = JSON.parse(str);
      if (json && typeof json.token === 'string') {
        return json as AppCredential;
      }
    } catch (e) {
      //
    }
    return null;
  },
  // クレデンシャルデータの更新
  (get, set, newCredential: AppCredential | null) => {
    // 破棄・変更のいずれの場合も, ユーザに紐づく情報(atom)はすべて破棄する
    set(authAtom.personalData, null);
    set(structureAtom.visibleRoomsAtom, []);
    set(structureAtom.joiningRoomsAtom, []);
    set(structureAtom.friends, []);
    set(structureAtom.focusedRoomIdAtom, -1);
    set(structureAtom.messagesInRoomAtom, {});
    set(structureAtom.membersInRoomAtom, {});
    if (!newCredential) {
      // データを破棄する場合
      localStorage.removeItem(credentialKey);
      set(storedCredentialStrAtom, '');
    } else {
      // データを変更する場合
      const s = JSON.stringify(newCredential);
      localStorage.setItem(credentialKey, s);
      set(storedCredentialStrAtom, s);
    }
  }
);

export const chatSocketFromCredential = (credential: AppCredential | null) => {
  if (!credential) {
    return null;
  }
  const socket = io(urlChatSocket, {
    auth: (cb) => cb(credential),
  });
  return socket;
};

/**
 * ユーザに紐づくチャットWSのAtom
 */
export const chatSocketAtom = atom((get) =>
  chatSocketFromCredential(get(storedCredentialAtom))
);

/**
 * 呼び出すとアプリの「ログイン状態」を解除する関数、を返す。
 */
export const useLogout = () => {
  const [, setAuthState] = useAtom(authAtom.authFlowState);
  const [, setStoredCredential] = useAtom(storedCredentialAtom);
  const [, setPersonalData] = useAtom(authAtom.personalData);
  return () => {
    setStoredCredential(null);
    setPersonalData(null);
    setAuthState('NotAuthenticated');
  };
};

/**
 * アクセストークンとユーザ情報を与えるとアプリを「ログイン状態」にする関数、
 * を返す。
 */
export const useLoginLocal = () => {
  const [, setAuthState] = useAtom(authAtom.authFlowState);
  const [, setStoredCredential] = useAtom(storedCredentialAtom);
  const [, setPersonalData] = useAtom(authAtom.personalData);
  return (access_token: string, user: any) => {
    setStoredCredential({ token: access_token });
    setPersonalData(user);
    setAuthState('Authenticated');
  };
};
