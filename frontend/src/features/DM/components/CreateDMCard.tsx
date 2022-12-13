import { useAtom } from 'jotai';
import { Suspense, useState } from 'react';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import {
  InvitePrivateUserList,
  InvitePrivateUserListLoading,
} from '@/features/Chat/components/InvitePrivateUserList';
import { authAtom, chatSocketAtom } from '@/stores/auth';
import { displayUser, DmRoom } from '@/typedef';

import { DmCard } from '../DmCard';

const validateError = (response: { status: string }) => {
  switch (response.status) {
    case 'not found':
      return 'ルームが見つかりませんでした。';
    case 'caller is not owner':
      return 'オーナー権限がありません。';
    case 'caller is not joined':
      return 'ルームに入室していません。';
    case 'user does not exist':
      return '招待するユーザーが存在しません。';
    case 'user is joined already':
      return '招待したユーザーはすでに入室しています。';
    case 'banned':
    default:
      return 'ユーザーの招待に失敗しました。';
  }
};

export const CreateDMCard = (props: { closeModal: () => void }) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const take = 5;
  const [cursor, setCursor] = useState(0);
  const [users, setUsers] = useState<displayUser[]>([]);
  const [error, setError] = useState('');
  const [isFetched, setIsFetched] = useState(false);
  const [selectedUser, setSelectedUser] = useState<displayUser | null>(null);

  if (!personalData || !mySocket) return null;

  const prevIsDisabled = cursor <= 0;
  const nextIsDisabled = users.length < take;

  return (
    <div className="flex w-80 flex-col border-2 border-solid border-white bg-black">
      <FTH3>Sending DM to...</FTH3>
      <div className="flex flex-row p-2">
        <div className="flex w-full min-w-0 flex-col">
          <Suspense fallback={<InvitePrivateUserListLoading take={take} />}>
            <InvitePrivateUserList
              makeUrl={(take, cursor) =>
                `http://localhost:3000/users?take=${take}&cursor=${cursor}`
              }
              take={take}
              cursor={cursor}
              setCursor={setCursor}
              isFetched={isFetched}
              setIsFetched={setIsFetched}
              users={users}
              setUsers={setUsers}
              onSelect={setSelectedUser}
            />
          </Suspense>
        </div>
      </div>
      <div className="text-red-400">{error !== '' ? error : '　'}</div>
      <div className="flex flex-row justify-around p-2">
        <FTButton
          onClick={() => {
            setIsFetched(false);
            const newCursor = cursor - take >= 0 ? cursor - take : 0;
            setCursor(newCursor);
          }}
          disabled={prevIsDisabled}
        >
          {'<-'}
        </FTButton>
        <FTButton
          onClick={() => {
            setIsFetched(false);
            setCursor(cursor + take);
          }}
          disabled={nextIsDisabled}
        >
          {'->'}
        </FTButton>
      </div>
      <div className="px-2 py-4">
        <DmCard user={selectedUser || undefined} />
      </div>
    </div>
  );
};
