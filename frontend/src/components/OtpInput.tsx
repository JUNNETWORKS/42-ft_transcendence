import React, { useEffect, useState } from 'react';
import { FTTextField } from './FTBasicComponents';

const RE_DIGIT = new RegExp(/^\d+$/);

export type Props = {
  value: string;
  onChange: (value: string) => void;
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

export default function OtpInput({ value, onChange }: Props) {
  const valueLength = 6;
  const [items, setItems] = useState<string[]>(Array(6).fill(''));

  useEffect(() => {
    if (items.every((v) => RE_DIGIT.test(v))) {
      onChange(items.join(''));
    }
  }, [items, onChange]);
  const inputOnChange = (
    { target }: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const targetValue = target.value.trim();

    if (!RE_DIGIT.test(targetValue)) return;

    if (targetValue.length === 1) {
      setItems(items.map((v, i) => (i === idx ? targetValue : v)));
      focusNextInput(target);
    } else if (targetValue.length === valueLength) {
      setItems(targetValue.split(''));
      target.blur();
    }
  };

  const inputOnKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    console.log('got onkeydown key', e.key);
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

  const inputOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { target } = e;
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
          pattern="\d{1}"
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
}
