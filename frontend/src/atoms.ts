import { UserPersonalData } from './features/DevAuth/AuthCard';
import { atom, selector } from 'recoil';
import { AppCredential } from './hooks';
import { io } from 'socket.io-client';

export const personalDataAtom = atom<UserPersonalData | null>({
  key: 'personalData',
  default: null,
});

const credentialKey = 'ft_transcendence_credential';
const storedCredentialStrAtom = atom({
  key: 'storedCredentialStr',
  default: localStorage.getItem(credentialKey) || '',
});
export const storedCredentialAtom = selector({
  key: 'storedCredential',
  get: ({ get }) => {
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
  set: ({ set }, newCredential) => {
    if (!newCredential) {
      localStorage.removeItem(credentialKey);
      set(storedCredentialStrAtom, '');
    } else {
      const s = JSON.stringify(newCredential);
      localStorage.setItem(credentialKey, s);
      set(storedCredentialStrAtom, s);
    }
  },
});

const socketFromCredential = (credential: AppCredential | null) => {
  if (!credential) {
    return null;
  }
  const socket = io('http://localhost:3000/chat', {
    auth: (cb) => cb(credential),
  });
  return socket;
};

export const socketAtom = selector({
  key: 'socket',
  get: ({ get }) => socketFromCredential(get(storedCredentialAtom)),
});
