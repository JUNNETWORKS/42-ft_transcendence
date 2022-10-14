import { Modal } from './Modal';
import { UserProfileModal } from '@/features/User/UserProfileModal';
import { useState } from 'react';

export const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Modal closeModal={closeModal} isOpen={isOpen}>
        <UserProfileModal />
      </Modal>
      <div className="bg-primary bg-navbar-img">
        <div className="flex h-20 place-content-between">
          <p className="flex w-72 items-center justify-center text-5xl">HOME</p>
          <div className="flex w-72 gap-x-6 bg-secondary" onClick={openModal}>
            <img
              src="/Kizaru.png"
              alt="CurrentUserProfileImage"
              className="m-3 h-14 w-14"
            />
            <div className="flex flex-1 items-center text-2xl">totaisei</div>
          </div>
        </div>
      </div>
    </>
  );
};
