import { keyBy } from '@/utils';

export const DisplayNamePolicy = {
  min: 1,
  max: 20,
} as const;

export const validateDisplayName = (s: string) => {
  const trimmed = s.trim();
  const n = trimmed.length;
  if (!n) {
    return `${n}/${DisplayNamePolicy.max} too short`;
  }
  if (n > DisplayNamePolicy.max) {
    return `${n}/${DisplayNamePolicy.max} too long`;
  }
  return null;
};

export const validateEmail = (s: string) => {
  const trimmed = s.trim();
  if (!trimmed) {
    return 'empty?';
  }
  const emailRegExp = /^[^@]+?@[^@]+$/;
  const m = trimmed.match(emailRegExp);
  if (!m) {
    return 'not a valid email?';
  }
  return null;
};

export const PasswordPolicy = {
  min: 12,
  max: 60,
  types: 4,
  usableCharacters: /^[A-Za-z0-9/_-]+$/,
} as const;

/**
 * 登録用に厳しくバリデーションする
 */
export const validatePassword = (s: string, required: boolean) => {
  const trimmed = s.trim();
  const n = trimmed.length;
  if (n === 0) {
    if (!required) {
      return null;
    }
  }
  if (n < PasswordPolicy.min) {
    return `${n}/${PasswordPolicy.min} too short`;
  }
  if (PasswordPolicy.max < n) {
    return `${n}/${PasswordPolicy.max} too long`;
  }
  const characters = Object.keys(keyBy(trimmed.split(''), (c) => c));
  if (characters.length < PasswordPolicy.types) {
    return `too less character types (${characters.length}/${PasswordPolicy.types})`;
  }
  if (!trimmed.match(PasswordPolicy.usableCharacters)) {
    return 'unusable character detected';
  }
  return null;
};
