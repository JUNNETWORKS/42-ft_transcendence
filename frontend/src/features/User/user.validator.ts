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

export const userErrors = (
  mode: 'Create' | 'Update',
  params: {
    displayName: string;
    email?: string;
    password: string;
  }
) => {
  const errors = {
    displayName: validateDisplayName(params.displayName),
    email: mode === 'Create' ? validateEmail(params?.email || '') : null,
    password: validatePassword(params.password, mode === 'Create'),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};
