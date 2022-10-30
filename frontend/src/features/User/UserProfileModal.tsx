import { authAtom } from '@/atoms/auth';
import { useUpdateUser } from '@/atoms/store';
import { FTButton, FTTextField } from '@/components/FTBasicComponents';
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

const Edit = ({ user, setPhase, onClose }: InnerProp) => {
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);
  const [displayName, setDisplayName] = useState(user.displayName);
  const errors = displayNameErrors(displayName);
  const { updateOne } = useUpdateUser();
  const [state, submit] = useAPI('PATCH', `/me`, {
    payload: () => ({ displayName }),
    onFetched: (json) => {
      const u = json as TD.User;
      updateOne(u.id, u);
      setPersonalData({ ...personalData!, ...u });
      setPhase('Display');
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
            <div>{errors.displayName || '　'}</div>
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
          disabled={errors.some || state !== 'Neutral'}
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
  const presentator = (() => {
    switch (phase) {
      case 'Display':
        return <Display user={user} setPhase={setPhase} onClose={onClose} />;
      case 'Edit':
        return <Edit user={user} setPhase={setPhase} onClose={onClose} />;
      case 'EditPassword':
        return <></>;
    }
  })();
  return (
    <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
      {presentator}
    </div>
  );
};
