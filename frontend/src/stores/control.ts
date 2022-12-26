import { atom, useAtom } from 'jotai';

import { User } from '@/typedef';

export const modalAtom = {
  isOpenCreateForm: atom(false),
  isOpenUserSignUpForm: atom(false),
  userCard: {
    isOpen: atom(false),
    user: atom<User | null>(null),
    children: atom<JSX.Element | null>(null),
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
  const [, setChildren] = useAtom(modalAtom.userCard.children);
  return function (user: User, children?: JSX.Element) {
    setUser(user);
    setChildren(children || null);
    setIsOpen(true);
  };
}
