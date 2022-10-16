import { atom } from 'jotai';
import { UserPersonalData } from '@/features/DevAuth/AuthCard';
import { AppCredential } from './hooks';
import { io } from 'socket.io-client';

export const personalDataAtom = atom<UserPersonalData | null>(null);

const credentialKey = 'ft_transcendence_credential';
const storedCredentialStrAtom = atom<string>(
  localStorage.getItem(credentialKey) || ''
);
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

const socketFromCredential = (credential: AppCredential | null) => {
  if (!credential) {
    return null;
  }
  const socket = io('http://localhost:3000/chat', {
    auth: (cb) => cb(credential),
  });
  return socket;
};

export const socketAtom = atom((get) =>
  socketFromCredential(get(storedCredentialAtom))
);
