import {
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '@/validator/user.validator';

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

export const passwordErrors = (password: string) => {
  const errors = {
    password: validatePassword(password, true),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};

export const userUpdateErrors = (displayName: string, password: string) => {
  const errors = {
    displayName: validateDisplayName(displayName),
    password: validatePassword(password, false),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};

export const userCreateErrors = (
  displayName: string,
  email: string,
  password: string
) => {
  const errors = {
    displayName: validateDisplayName(displayName),
    email: validateEmail(email),
    password: validatePassword(password, true),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};
