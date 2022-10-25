import { atom } from 'jotai';
import { UserPersonalData } from '@/components/AuthCard';
import { AppCredential } from '../hooks';
import { io } from 'socket.io-client';
import { AuthenticationFlowState, urlChatSocket } from '../auth';
import { structureAtom } from './structure';

export const authAtom = {
  authFlowState: atom<AuthenticationFlowState>('Neutral'),
  /**
   * ユーザデータのAtom
   */
  personalDataAtom: atom<UserPersonalData | null>(null),
};

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
  // クレデンシャルデータの更新
  (get, set, newCredential: AppCredential | null) => {
    // 破棄・変更のいずれの場合も, ユーザに紐づく情報(atom)はすべて破棄する
    set(authAtom.personalDataAtom, null);
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
