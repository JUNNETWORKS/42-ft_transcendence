import { atom, useAtom } from 'jotai';
import { UserPersonalData } from '@/components/AuthCard';
import { AppCredential } from './hooks';
import { io } from 'socket.io-client';
import { AuthenticationFlowState, urlChatSocket } from './auth';
import * as TD from './typedef';

/**
 * 認証フロー状態のAtom
 */
export const authFlowStateAtom = atom<AuthenticationFlowState>('Neutral');

export const userAtoms = {
  /**
   * ユーザデータのAtom
   */
  personalDataAtom: atom<UserPersonalData | null>(null),

  // 見えているチャットルームの一覧
  visibleRoomsAtom: atom<TD.ChatRoom[]>([]),
  // join しているチャットルームの一覧
  joiningRoomsAtom: atom<TD.ChatRoom[]>([]),
  // 今フォーカスしているチャットルームのID
  focusedRoomIdAtom: atom<number>(-1),
  /**
   * チャットルーム内のメッセージのリスト
   */
  messagesInRoomAtom: atom<{
    [roomId: number]: TD.ChatRoomMessage[];
  }>({}),
  /**
   * チャットルーム内のメンバーのマップ
   */
  membersInRoomAtom: atom<{
    [roomId: number]: TD.UserRelationMap;
  }>({}),
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
    set(userAtoms.personalDataAtom, null);
    set(userAtoms.visibleRoomsAtom, []);
    set(userAtoms.joiningRoomsAtom, []);
    set(userAtoms.focusedRoomIdAtom, -1);
    set(userAtoms.messagesInRoomAtom, {});
    set(userAtoms.membersInRoomAtom, {});
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