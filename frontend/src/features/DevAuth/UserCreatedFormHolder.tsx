import { Modal } from '@/components/Modal';
import { useUserCreatedForm, useUserSignupForm } from '@/stores/control';

import { UserCreatedForm } from '../User/UserCreatedForm';
import { UserRegisterForm } from '../User/UserRegisterForm';

export const UserCreatedFormHolder = () => {
  const [isOpenCreatedForm, setIsOpenCreatedForm] = useUserCreatedForm();
  const [isOpenSignUpForm, setIsOpenSignUpForm] = useUserSignupForm();

  return (
    <>
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
      <Modal
        closeModal={() => setIsOpenSignUpForm(false)}
        isOpen={isOpenSignUpForm}
        traPart={{
          enter: 'transition duration-[200ms] ease-out',
          leave: 'transition duration-[200ms] ease-out',
        }}
      >
        <UserRegisterForm onClose={() => setIsOpenSignUpForm(false)} />
      </Modal>
    </>
  );
};
