import { useState, useMemo } from 'react';

import { AppCredential } from '@/stores/auth';

/**
 * `localStorage`**など**に保存されているクレデンシャル情報を取得・更新するフック。
 * @returns
 */
export const useStoredCredential = () => {
  // TODO: 定数なのでどっかで一元管理
  const credentialKey = 'ft_transcendence_credential';
  const [storedStr, setStoredStr] = useState(
    localStorage.getItem(credentialKey) || ''
  );

  const getter = useMemo((): AppCredential | null => {
    try {
      const credential = JSON.parse(storedStr);
      if (credential && typeof credential === 'object') {
        const token = credential.token;
        if (typeof token === 'string') {
          return { token };
        }
      }
    } catch (e) {
      //
    }
    return null;
  }, [storedStr]);

  const setter = (val: AppCredential | null) => {
    setStoredStr((prev) => {
      if (!val) {
        // 削除
        localStorage.removeItem(credentialKey);
        return '';
      }
      const str = JSON.stringify(val);
      if (str === prev) {
        return prev;
      }
      localStorage.setItem(credentialKey, str);
      return str;
    });
  };
  return [getter, setter] as const;
};
