import { authAtom } from '@/atoms/auth';
import { useUpdateUser } from '@/atoms/store';
import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { APIError } from '@/errors/APIError';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useAPI } from '@/hooks';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { displayNameErrors } from './user.validator';

type Phase = 'Display' | 'Edit' | 'EditPassword';

type Prop = {
  user: TD.User;
  onClose: () => void;
};

type InnerProp = Prop & {
  setPhase: (phase: Phase) => void;
};

const EditDisplayName = ({ user, setPhase, onClose }: InnerProp) => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [displayName, setDisplayName] = useState(user.displayName);
  const validationErrors = displayNameErrors(displayName);
  const [netErrors, setNetErrors] = useState<{ [key: string]: string }>({});
  const { updateOne } = useUpdateUser();
  const [state, submit] = useAPI('PATCH', `/me`, {
    payload: () => ({ displayName }),
    onFetched: (json) => {
      const u = json as TD.User;
      updateOne(u.id, u);
      setPersonalData({ ...personalData!, ...u });
      setNetErrors({});
      setPhase('Display');
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
  return (
    <>
      <div className="flex gap-8">
        <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" />
        <div className="flex flex-col justify-around">
          <div className="text-2xl">Id: {user.id}</div>
          <div className="text-2xl">
            <FTTextField
              className="border-2"
              autoComplete="off"
              placeholder="Name:"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="text-red-400">
              {validationErrors.displayName || netErrors.displayName || '　'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-around gap-8">
        <FTButton
          onClick={() => {
            setPhase('Display');
          }}
        >
          Cancel
        </FTButton>
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

const Display = ({ user, setPhase, onClose }: InnerProp) => {
  const navigation = useNavigate();
  return (
    <>
      <div className="flex gap-8">
        <img className="h-24 w-24" src="/Kizaru.png" alt="UserProfileImage" />
        <div className="flex flex-col justify-around">
          <p className="text-2xl">Id: {user.id}</p>
          <p className="text-2xl">Name: {user.displayName}</p>
        </div>
      </div>
      <div className="flex justify-around gap-8">
        <FTButton
          onClick={() => {
            navigation('/auth');
            onClose();
          }}
        >
          認証ページ
        </FTButton>
        <FTButton onClick={() => setPhase('Edit')}>ユーザ情報変更</FTButton>
        <FTButton
          onClick={() => {
            navigation('/auth');
            onClose();
          }}
        >
          パスワード変更
        </FTButton>
      </div>
    </>
  );
};

export const UserProfileModal = ({ user, onClose }: Prop) => {
  const [phase, setPhase] = useState<Phase>('Display');
  const presentator = () => {
    switch (phase) {
      case 'Display':
        return <Display user={user} setPhase={setPhase} onClose={onClose} />;
      case 'Edit':
        return (
          <EditDisplayName user={user} setPhase={setPhase} onClose={onClose} />
        );
      case 'EditPassword':
        return <></>;
    }
  };
  return (
    <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
      {presentator()}
    </div>
  );
};
