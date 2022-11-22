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
      className={`m-3 ${props.className || 'h-14 w-14'} object-cover`}
    />
  );
};
