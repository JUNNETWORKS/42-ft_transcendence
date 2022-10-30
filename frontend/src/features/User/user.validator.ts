import * as TD from '@/typedef';

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
