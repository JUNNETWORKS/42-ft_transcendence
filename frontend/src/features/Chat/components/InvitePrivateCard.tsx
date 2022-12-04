import { useAtom } from 'jotai';
import { Suspense, useState } from 'react';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
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
    <div className="flex w-60 flex-col border-2 border-solid border-white bg-black">
      <FTH3>invite to private room</FTH3>
      <div className="flex flex-row p-2">
        <Suspense fallback={<div>Loading...</div>}>
          <InvitePrivateUserList url={url} users={users} setUsers={setUsers} />
        </Suspense>
      </div>
      <div className="flex flex-row justify-around p-2">
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
