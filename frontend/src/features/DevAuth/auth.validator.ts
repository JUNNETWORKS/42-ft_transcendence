const validateTotp = (s: string) => {
  if (!s) {
    return 'empty?';
  }
  return null;
};

export const totpErrors = (totpStr: string) => {
  const errors = {
    totp: validateTotp(totpStr),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};

const validateUserIdStr = (s: string) => {
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

export const selfErrors = (userIdStr: string) => {
  const errors = {
    userIdStr: validateUserIdStr(userIdStr),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};

const validateEmail = (s: string) => {
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

const validatePassword = (s: string) => {
  const trimmed = s.trim();
  if (!trimmed) {
    return 'empty?';
  }
  return null;
};

export const passwordErrors = (email: string, password: string) => {
  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};
