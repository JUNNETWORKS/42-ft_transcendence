import React, { useMemo } from 'react';
import { FTTextField } from './FTBasicComponents';

const RE_DIGIT = new RegExp(/^\d+$/);

export type Props = {
  value: string;
  valueLength: number;
  onChange: (value: string) => void;
};

export default function OtpInput({ value, valueLength, onChange }: Props) {
  console.log('render otpInput value:', value);
  const valueItems = useMemo(() => {
    const valueArray = value.split('');
    const items: Array<string> = [];

    for (let i = 0; i < valueLength; i++) {
      const char = valueArray[i];
      if (RE_DIGIT.test(char)) {
        items.push(char);
      } else {
        items.push('');
      }
    }

    return items;
  }, [value, valueLength]);

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

  const inputOnChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    console.log('got onchange');
    const target = e.target;
    let targetValue = target.value.trim();
    const isTargetValueDigit = RE_DIGIT.test(targetValue);

    const nextInputEl = target.nextElementSibling as HTMLInputElement | null;
    if (!isTargetValueDigit && nextInputEl && nextInputEl.value !== '') {
      return;
    }

    targetValue = isTargetValueDigit ? targetValue : ' ';

    if (targetValue.length === 1) {
      const newValue =
        value.substring(0, idx) + targetValue + value.substring(idx + 1);
      onChange(newValue.substring(0, 6));

      if (!isTargetValueDigit) {
        return;
      }
      focusNextInput(target);
    } else if (targetValue.length === valueLength) {
      onChange(targetValue);

      target.blur();
    }
  };

  const inputOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('got onkeydown');
    const target = e.target as HTMLInputElement;
    if (e.key !== 'Backspace' || target.value !== '') {
      return;
    }
    focusPrevInput(target);
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
      {valueItems.map((digit, idx) => (
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
          onKeyDown={inputOnKeyDown}
          onFocus={inputOnFocus}
        />
      ))}
    </div>
  );
}
