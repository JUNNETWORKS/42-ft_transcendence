import { useAtom } from 'jotai';

import { Modal } from '@/components/Modal';
import { modalAtom } from '@/stores/control';

import { UserCard } from './UserCard';

export const UserCardHolder = () => {
  const [isOpen, setIsOpen] = useAtom(modalAtom.userCard.isOpen);
  const [user] = useAtom(modalAtom.userCard.user);
  const [children] = useAtom(modalAtom.userCard.children);
  // ここで if (!user) { return null; } としてしまうと,
  // モーダルの初回表示時に出現アニメーションが効かない
  return (
    <Modal closeModal={() => setIsOpen(false)} isOpen={isOpen}>
      {user && (
        <UserCard id={user.id} onClose={() => setIsOpen(false)}>
          {children}
        </UserCard>
      )}
    </Modal>
  );
};
