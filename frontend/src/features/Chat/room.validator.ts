import * as TD from '@/typedef';
import { keyBy } from '@/utils';

const validateRoomName = (s: string) => {
  const trimmed = s.trim();
  if (trimmed.length < 2) {
    return 'too short';
  }
  if (50 < trimmed.length) {
    return 'too long';
  }
  return null;
};
const validatePassword = (s: string, t: TD.RoomType) => {
  if (t === 'LOCKED') {
    const trimmed = s.trim();
    if (trimmed.length < 4) {
      return 'too short';
    }
    if (40 < trimmed.length) {
      return 'too long';
    }
    const characters = Object.keys(keyBy(trimmed.split(''), (c) => c)).length;
    if (characters < 4) {
      return 'too less character types';
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
