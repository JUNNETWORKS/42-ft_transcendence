import React, { useEffect, useState } from 'react';
import { FTTextField } from '../../../components/FTBasicComponents';

const RE_DIGIT = new RegExp(/^\d+$/);

export type Props = {
  setOtp: (value: string) => void;
  submit: () => Promise<void>;
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

export const OtpInput = ({ setOtp, submit }: Props) => {
  const valueLength = 6;
  const [items, setItems] = useState<string[]>(Array(6).fill(''));

  const inputOnChange = (
    { target }: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const targetValue = target.value.trim();

    if (!RE_DIGIT.test(targetValue)) return;

    let newValue;
    if (targetValue.length === 1) {
      newValue = items.map((v, i) => (i === idx ? targetValue : v));
      setItems(newValue);
      focusNextInput(target);
    } else if (targetValue.length === valueLength) {
      newValue = targetValue.split('');
      setItems(newValue);
      target.blur();
    }

    if (newValue && newValue.every((v) => RE_DIGIT.test(v))) {
      setOtp(newValue.join(''));
      submit();
    }
  };

  const inputOnKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    const target = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && target.value === '') {
      setItems(items.map((v, i) => (i === idx - 1 ? '' : v)));
      focusPrevInput(target);
      return;
    }
    if (e.key === 'Backspace') {
      setItems(items.map((v, i) => (i === idx ? '' : v)));
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
      {items.map((digit, idx) => (
        <FTTextField
          key={idx}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={valueLength}
          className="h-14 w-12 rounded-sm border text-center text-3xl caret-transparent"
          value={digit}
          onChange={(e) => inputOnChange(e, idx)}
          onKeyDown={(e) => inputOnKeyDown(e, idx)}
          onFocus={inputOnFocus}
        />
      ))}
    </div>
  );
};