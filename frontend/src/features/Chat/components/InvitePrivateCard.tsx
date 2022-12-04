import { useAtom } from 'jotai';
import { Suspense, useState } from 'react';

import { FTButton } from '@/components/FTBasicComponents';
import { authAtom } from '@/stores/auth';
import { displayUser } from '@/typedef';

import { InvitePrivateUserList } from './InvitePrivateUserList';

export const InvitePrivateCard = () => {
  const [personalData] = useAtom(authAtom.personalData);
  const take = 2;
  const [cursor, setCursor] = useState(0);
  const [users, setUsers] = useState<displayUser[]>([]);
  const url = `http://localhost:3000/users?take=${take}&cursor=${cursor}`;

  // TODO: ユーザーをListboxとかで一覧表示する（このとき自分を表示しない）
  // TODO: 実行者が選択したユーザーをft_inviteで投げる
  // TODO: ft_inviteのレスポンスを表示する（トースト通知の方がよい？）

  if (!personalData) return null;
  return (
    <div className="flex flex-col">
      <Suspense fallback={<div>Loading...</div>}>
        <InvitePrivateUserList url={url} users={users} setUsers={setUsers} />
      </Suspense>
      <div className="flex flex-row">
        <FTButton
          onClick={() => {
            setUsers([]);
            const newCursor = cursor - take >= 0 ? cursor - take : 0;
            setCursor(newCursor);
          }}
        >
          {'<-'}
        </FTButton>
        <FTButton
          onClick={() => {
            setUsers([]);
            setCursor(cursor + take);
          }}
        >
          {'->'}
        </FTButton>
      </div>
    </div>
  );
};
