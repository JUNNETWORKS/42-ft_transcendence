import React from 'react';
import { FTTextField } from '../../../components/FTBasicComponents';

const RE_DIGIT = new RegExp(/^\d+$/);

export type Props = {
  otpLength: number;
  otpArray: string[];
  submit: (otpString: string) => void;
  setOtp: (newValue: string[]) => void;
};

const focusPrevInput = (target: HTMLElement) => {
  const previousElementSibling =
    target.previousElementSibling as HTMLInputElement | null;
  previousElementSibling?.focus();
};

const focusNextInput = (target: HTMLElement) => {
  const nextElementSibling =
    target.nextElementSibling as HTMLInputElement | null;
  nextElementSibling?.focus();
};

export const OtpInput = ({ otpLength, otpArray, submit, setOtp }: Props) => {
  const inputOnInput = (
    { target }: React.FormEvent<HTMLInputElement>,
    idx: number
  ) => {
    const elem = target as HTMLInputElement;
    const targetValue = elem.value.trim();

    if (!RE_DIGIT.test(targetValue)) return;
    if (targetValue.length !== 1) {
      return;
    }
    const nextOtp = otpArray.map((v, i) => (i === idx ? targetValue : v));
    setOtp(nextOtp);
    const otpString = nextOtp.join('');
    if (idx + 1 < otpLength) {
      focusNextInput(elem);
    } else if (idx + 1 === otpLength) {
      submit(otpString);
      elem.setSelectionRange(0, elem.value.length);
    }
  };

  const inputOnKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    const target = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && target.value === '') {
      setOtp(otpArray.map((v, i) => (i === idx - 1 ? '' : v)));
      focusPrevInput(target);
      return;
    }
    if (e.key === 'Backspace') {
      setOtp(otpArray.map((v, i) => (i === idx ? '' : v)));
      return;
    }
  };

  const inputOnFocus = ({ target }: React.FocusEvent<HTMLInputElement>) => {
    const prevInputEl =
      target.previousElementSibling as HTMLInputElement | null;

    if (prevInputEl && prevInputEl.value === '') {
      return prevInputEl.focus();
    }
    target.setSelectionRange(0, target.value.length);
  };

  return (
    <div className="flex w-full justify-center gap-x-4">
      {otpArray.map((digit, idx) => (
        <FTTextField
          key={idx}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={otpLength}
          className="h-14 w-12 rounded-sm border text-center text-3xl caret-transparent"
          value={digit}
          onInput={(e) => inputOnInput(e, idx)}
          onKeyDown={(e) => inputOnKeyDown(e, idx)}
          onFocus={inputOnFocus}
        />
      ))}
    </div>
  );
};
