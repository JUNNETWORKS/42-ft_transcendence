import { useAtom } from 'jotai';

import { authAtom } from '@/stores/auth';

export const usePersonalData = () => {
  return useAtom(authAtom.personalData);
};
