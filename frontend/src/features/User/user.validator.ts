import { keyBy } from '@/utils';

const validateDisplayName = (s: string) => {
  const trimmed = s.trim();
  if (!trimmed) {
    return 'empty?';
  }
  return null;
};

export const displayNameErrors = (displayName: string) => {
  const errors = {
    displayName: validateDisplayName(displayName),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};

const validatePassword = (s: string) => {
  const trimmed = s.trim();
  const n = trimmed.length;
  if (n < 12) {
    return `${n}/12 too short`;
  }
  if (60 < n) {
    return `${n}/60 too long`;
  }
  const characters = Object.keys(keyBy(trimmed.split(''), (c) => c));
  if (characters.length < 4) {
    return `too less character types (${characters.length}/4)`;
  }
  if (trimmed.match(/[^A-Za-z0-9/_-]/)) {
    return 'unusable character detected';
  }
  return null;
};

export const passwordErrors = (password: string) => {
  const errors = {
    password: validatePassword(password),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};
