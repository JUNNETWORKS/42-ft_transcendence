import { useState } from 'react';

export const useOtp = (length: number) => {
  const [str, setStr] = useState('');
  const [arr, setArr] = useState<string[]>(Array(length).fill(''));

  const setValue = (newValue: string[]) => {
    setArr(newValue);
    setStr(newValue.join(''));
  };

  const clearValue = () => {
    setStr('');
    setArr(Array(length).fill(''));
  };

  return [str, arr, setValue, clearValue] as const;
};
