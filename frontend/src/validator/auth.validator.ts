export const validateTotp = (s: string) => {
  if (!s) {
    return 'empty?';
  }
  return null;
};

export const validateUserIdStr = (s: string) => {
  if (!s) {
    return 'empty?';
  }
  const n = parseInt(s);
  if (`${n}` !== s) {
    return 'not a valid number?';
  }
  if (n < 1) {
    return 'not a valid userId?';
  }
  return null;
};

/**
 * ログイン用なのであまり厳しくバリデーションしない
 */
export const validatePassword = (s: string) => {
  const trimmed = s.trim();
  if (!trimmed) {
    return 'empty?';
  }
  return null;
};
