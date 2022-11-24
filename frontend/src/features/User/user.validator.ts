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
  const policy = {
    min: 12,
    max: 60,
    types: 4,
    usableCharacters: /^[A-Za-z0-9/_-]+$/,
  };
  const n = trimmed.length;
  if (n < policy.min) {
    return `${n}/${policy.min} too short`;
  }
  if (policy.max < n) {
    return `${n}/${policy.max} too long`;
  }
  const characters = Object.keys(keyBy(trimmed.split(''), (c) => c));
  if (characters.length < policy.types) {
    return `too less character types (${characters.length}/${policy.types})`;
  }
  if (!trimmed.match(policy.usableCharacters)) {
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
