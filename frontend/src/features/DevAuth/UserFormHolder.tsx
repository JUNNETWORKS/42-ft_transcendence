import { Modal } from '@/components/Modal';
import { usePersonalData } from '@/hooks/usePersonalData';
import { useLoginLocal } from '@/stores/auth';
import { useUserCreatedForm, useUserSignupForm } from '@/stores/control';
import { useUpdateUser } from '@/stores/store';

import { popAuthImportantInfo } from '../Toaster/toast';
import { UserForm } from './UserForm';

export const UserFormHolder = () => {
  const [personalData] = usePersonalData();
  const loginLocal = useLoginLocal();
  const { updateOne } = useUpdateUser();
  const [, , patchUserData] = usePersonalData();
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
        <div className="flex w-[480px] flex-col justify-around border-4 border-white bg-black">
          {personalData && (
            <UserForm
              userData={personalData}
              onClose={(user) => {
                if (user) {
                  updateOne(user.id, user);
                  patchUserData({ ...user, avatarTime: Date.now() });
                  popAuthImportantInfo('ユーザ情報を変更しました');
                }
                setIsOpenCreatedForm(false);
              }}
            />
          )}
        </div>
      </Modal>
      <Modal
        closeModal={() => setIsOpenSignUpForm(false)}
        isOpen={isOpenSignUpForm}
        traPart={{
          enter: 'transition duration-[200ms] ease-out',
          leave: 'transition duration-[200ms] ease-out',
        }}
      >
        <div className="flex w-[480px] flex-col justify-around border-4 border-white bg-black">
          <UserForm
            onClose={(user, access_token) => {
              if (user && access_token) {
                loginLocal(access_token, user);
                popAuthImportantInfo('ユーザ登録が完了しました');
              }
              setIsOpenSignUpForm(false);
            }}
          />
        </div>
      </Modal>
    </>
  );
};
