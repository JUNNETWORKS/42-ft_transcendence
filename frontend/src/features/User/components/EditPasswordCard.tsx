import { useAtom } from 'jotai';
import { useState } from 'react';

import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { Icons } from '@/icons';
import { authAtom, useLoginLocal } from '@/stores/auth';
import * as TD from '@/typedef';

import { passwordErrors } from '../user.validator';

type Prop = {
  user: TD.User;
  onClose: () => void;
};

export const EditPasswordCard = ({ onClose }: Prop) => {
  const [personalData] = useAtom(authAtom.personalData);
  const [password, setPassword] = useState('');
  const loginLocal = useLoginLocal();
  const validationErrors = passwordErrors(password);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const [state, submit] = useAPI('PATCH', `/me/password`, {
    payload: () => ({ password }),
    onFetched: (json) => {
      const data = json as { access_token: string };
      setNetErrors({});
      loginLocal(data.access_token, personalData);
      onClose();
    },
    onFailed(e) {
      if (e instanceof APIError) {
        e.response.json().then((json: any) => {
          console.log({ json });
          if (typeof json === 'object') {
            setNetErrors(json);
          }
        });
      }
    },
  });

  if (!personalData) {
    return null;
  }
  const passwordError = validationErrors.password || netErrors.password;
  return (
    <>
      <div className="flex flex-row items-center justify-center gap-2">
        <div>
          <p className="">新しいパスワード:</p>
          <div className="text-red-400">&nbsp;</div>
        </div>
        <div>
          <FTTextField
            className="w-[16em] border-2"
            autoComplete="off"
            placeholder="12 - 60文字"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError ? (
            <div className="text-red-400">{passwordError}</div>
          ) : (
            <div>{password.length}/60</div>
          )}
        </div>
      </div>
      <div className="flex justify-around gap-8">
        <FTButton onClick={onClose}>Cancel</FTButton>
        <FTButton
          className="mr-2 disabled:opacity-50"
          disabled={validationErrors.some || state === 'Fetching'}
          onClick={submit}
        >
          <InlineIcon i={<Icons.Save />} />
          Save
        </FTButton>
      </div>
    </>
  );
};
