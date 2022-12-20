import { useAtom } from 'jotai';

import { authAtom } from '@/stores/auth';

export const usePersonalData = () => {
  const [val, setter] = useAtom(authAtom.personalData);
  const [, patcher] = useAtom(authAtom.writeOnlyPersonalData);
  return [val, setter, patcher] as const;
};
