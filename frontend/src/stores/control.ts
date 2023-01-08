import { atom, useAtom } from 'jotai';

import { User } from '@/typedef';

export const modalAtom = {
  isOpenCreateForm: atom(false),
  isOpenUserSignUpForm: atom(false),
  userCard: {
    isOpen: atom(false),
    user: atom<User | null>(null),
    inner: atom<{ f: () => JSX.Element } | null>(null),
  },
};

export function useUserSignupForm() {
  return useAtom(modalAtom.isOpenUserSignUpForm);
}

export function useUserCreatedForm() {
  return useAtom(modalAtom.isOpenCreateForm);
}

export function useUserCard() {
  const [, setIsOpen] = useAtom(modalAtom.userCard.isOpen);
  const [, setUser] = useAtom(modalAtom.userCard.user);
  const [, setInner] = useAtom(modalAtom.userCard.inner);
  return function (user: User, inner?: () => JSX.Element) {
    setUser(user);
    setInner(inner ? { f: inner } : null);
    setIsOpen(true);
  };
}
