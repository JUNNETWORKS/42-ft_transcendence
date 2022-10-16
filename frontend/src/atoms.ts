import { atom } from 'jotai';
import { UserPersonalData } from '@/features/DevAuth/AuthCard';

export const personalDataAtom = atom<UserPersonalData | null>(null);
