import React from 'react';
import * as TD from '@/typedef';

type Props = {
  user: TD.User;
  className?: string;
};

export const UserAvatar = (props: Props) => {
  return (
    <img
      src={
        props.user.isEnabledAvatar
          ? `http://localhost:3000/users/${props.user.id}/avatar?${
              props.user.avatarTime || 0
            }`
          : '/Kizaru.png'
      }
      alt="CurrentUserProfileImage"
      className={props.className || 'm-3 h-14 w-14'}
    />
  );
};
