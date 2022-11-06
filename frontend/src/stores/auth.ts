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
};

export const authAtom = {
  authFlowState: atom<AuthenticationFlowState>('Neutral'),
  /**
   * ユーザデータのAtom
   */
  personalData: atom<UserPersonalData | null>(null),
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

export const useLogout = () => {
  const setAuthState = useAtom(authAtom.authFlowState)[1];
  const setStoredCredential = useAtom(storedCredentialAtom)[1];
  const setPersonalData = useAtom(authAtom.personalData)[1];
  return () => {
    setStoredCredential(null);
    setPersonalData(null);
    setAuthState('NotAuthenticated');
  };
};

export const useLoginLocal = () => {
  const setAuthState = useAtom(authAtom.authFlowState)[1];
  const setStoredCredential = useAtom(storedCredentialAtom)[1];
  const setPersonalData = useAtom(authAtom.personalData)[1];
  return (token: string, user: any) => {
    setStoredCredential({ token });
    setPersonalData(user);
    setAuthState('Authenticated');
  };
};
