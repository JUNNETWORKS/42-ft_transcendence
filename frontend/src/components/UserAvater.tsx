import * as TD from '@/typedef';

type Props = {
  user: {
    id: number;
    isEnabledAvatar: boolean;
    avatarTime: number;
  };
  className?: string;
};

export const UserAvatar = ({ user, className }: Props) => {
  return (
    <img
      src={
        user.isEnabledAvatar
          ? `http://localhost:3000/users/${user.id}/avatar?${user.avatarTime}`
          : '/Kizaru.png'
      }
      alt="CurrentUserProfileImage"
      className={`${className || 'm-3 h-14 w-14'} object-cover`}
    />
  );
};
