import { useAtom } from 'jotai';

import { dataAtom } from '@/stores/structure';

export const useBlocking = () => {
  return useAtom(dataAtom.blockingUsers);
};
