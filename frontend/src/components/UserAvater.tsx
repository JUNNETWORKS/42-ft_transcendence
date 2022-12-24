import * as TD from '@/typedef';

type Props = {
  user?: {
    id: number;
    isEnabledAvatar: boolean;
    avatarTime: number;
  };
  className?: string;
  onClick?: () => void;
};

export const UserAvatar = ({ user, className, onClick }: Props) => {
  if (user) {
    return (
      <img
        src={
          user.isEnabledAvatar
            ? `http://localhost:3000/users/${user.id}/avatar?${user.avatarTime}`
            : '/Kizaru.png'
        }
        alt="CurrentUserProfileImage"
        className={`${className || 'm-3 h-14 w-14'} object-cover ${
          onClick ? ' cursor-pointer' : ''
        }`}
        onClick={onClick}
      />
    );
  } else {
    return (
      <div
        className={`${className || 'm-3 h-14 w-14'} border-2 object-cover ${
          onClick ? ' cursor-pointer' : ''
        }`}
        onClick={onClick}
      />
    );
  }
};
