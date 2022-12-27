import { useAtom } from 'jotai';

import { Modal } from '@/components/Modal';
import { modalAtom } from '@/stores/control';

import { UserCreatedForm } from '../User/UserCreatedForm';

export const UserCreatedFormHolder = () => {
  const [isOpenCreatedForm, setIsOpenCreatedForm] = useAtom(
    modalAtom.isOpenCreateForm
  );

  return (
    <Modal
      closeModal={() => setIsOpenCreatedForm(false)}
      isOpen={isOpenCreatedForm}
      traPart={{
        enter: 'delay-200 transition duration-[500ms] ease-out',
        leave: 'transition duration-[500ms] ease-out',
      }}
    >
      <UserCreatedForm onClose={() => setIsOpenCreatedForm(false)} />
    </Modal>
  );
};