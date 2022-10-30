import { atom } from 'jotai';
import { UserPersonalData } from '@/components/AuthCard';
import { AppCredential } from '../hooks';
import { io } from 'socket.io-client';
import { AuthenticationFlowState, urlChatSocket } from '../auth';

/**
 * 認証フロー状態のAtom
 */
export const authFlowStateAtom = atom<AuthenticationFlowState>('Neutral');

/**
 * ユーザデータのAtom
 */
export const personalDataAtom = atom<UserPersonalData | null>(null);

const credentialKey = 'ft_transcendence_credential';
/**
 * ローカルに保存されているクレデンシャルの文字列データのAtom
 */
const storedCredentialStrAtom = atom<string>(
  localStorage.getItem(credentialKey) || ''
);

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
  (get, set, newCredential: AppCredential | null) => {
    if (!newCredential) {
      localStorage.removeItem(credentialKey);
      set(storedCredentialStrAtom, '');
    } else {
      const s = JSON.stringify(newCredential);
      localStorage.setItem(credentialKey, s);
      set(storedCredentialStrAtom, s);
    }
  }
);

const chatSocketFromCredential = (credential: AppCredential | null) => {
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
