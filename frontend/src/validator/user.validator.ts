import { keyBy } from '@/utils';

export const validateDisplayName = (s: string) => {
  const trimmed = s.trim();
  const policy = {
    min: 1,
    max: 20,
  };
  if (!trimmed) {
    return 'empty?';
  }
  const n = trimmed.length;
  if (n > policy.max) {
    return `${n}/${policy.max} too long`;
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

/**
 * 登録用に厳しくバリデーションする
 */
export const validatePassword = (s: string, required: boolean) => {
  const trimmed = s.trim();
  const policy = {
    min: 12,
    max: 60,
    types: 4,
    usableCharacters: /^[A-Za-z0-9/_-]+$/,
  };
  const n = trimmed.length;
  if (n === 0) {
    if (!required) {
      return null;
    }
  }
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
