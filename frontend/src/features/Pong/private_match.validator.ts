import * as TD from '@/typedef';
import { isfinite, keyBy } from '@/utils';

const maxScorePolicy = {
  min: 1,
  max: 100,
};

const validateMaxScore = (s: string) => {
  const trimmed = s.trim();
  if (!trimmed) {
    return 'empty?';
  }
  if (trimmed.match(/[^0-9]/)) {
    return 'not an integer?';
  }
  const n = parseInt(s);
  if (!isfinite(n)) {
    return 'not an integer?';
  }
  if (n < maxScorePolicy.min || maxScorePolicy.max < n) {
    return 'out of range?';
  }
  return null;
};

export const privateMatchErrors = (maxScoreStr: string) => {
  const errors = {
    maxScoreStr: validateMaxScore(maxScoreStr),
  };
  return {
    ...errors,
    some: (Object.keys(errors) as (keyof typeof errors)[]).some(
      (key) => errors[key]
    ),
  };
};
