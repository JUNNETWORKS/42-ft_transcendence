import { useState } from 'react';

export const useOtp = (length: number) => {
  const [str, setStr] = useState('');
  const [arr, setArr] = useState<string[]>(Array(length).fill(''));

  const setValue = (newValue: string[]) => {
    setArr(newValue);
    setStr(newValue.join(''));
  };

  return [str, arr, setValue] as const;
};
