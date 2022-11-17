import * as TD from '@/typedef';

const validateRoomName = (s: string) => {
  const trimmed = s.trim();
  if (!trimmed) {
    return 'empty?';
  }
  return null;
};
const validatePassword = (s: string, t: TD.RoomType) => {
  if (t === 'LOCKED') {
    const trimmed = s.trim();
    if (!trimmed) {
      return 'empty?';
    }
    if (trimmed.length < 4) {
      return 'too short';
    }
  }
  return null;
};

export const roomErrors = (
  roomName: string,
  roomType: TD.RoomType,
  roomPassword: string
) => {
  const errors = {
    roomName: validateRoomName(roomName),
    roomPassword: validatePassword(roomPassword, roomType),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};
