import {
  validatePassword,
  validateTotp,
  validateUserIdStr,
} from '@/validator/auth.validator';
import { validateEmail } from '@/validator/user.validator';

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
