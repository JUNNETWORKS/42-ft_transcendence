import { useAtom } from 'jotai';

import { dataAtom } from '@/stores/structure';

export const useFriends = () => {
  return useAtom(dataAtom.friends);
};
