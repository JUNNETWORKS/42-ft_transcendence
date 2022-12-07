import { useAtom } from 'jotai';
import { Suspense, useState } from 'react';

import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { authAtom, chatSocketAtom } from '@/stores/auth';
import { displayUser, ChatRoom } from '@/typedef';

import {
  InvitePrivateUserList,
  InvitePrivateUserListLoading,
} from './InvitePrivateUserList';

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

export const InvitePrivateCard = (props: {
  room: ChatRoom;
  closeModal: () => void;
}) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const take = 2;
  const [cursor, setCursor] = useState(0);
  const [users, setUsers] = useState<displayUser[]>([]);
  const [error, setError] = useState('');
  const [isFetched, setIsFetched] = useState(false);

  // TODO: ft_inviteのレスポンスを表示する（トースト通知の方がよい？）

  if (!personalData || !mySocket) return null;

  const submit = (targetUser: number) => {
    const data = {
      roomId: props.room.id,
      users: [targetUser],
    };
    console.log(data);
    setError('');
    mySocket.emit('ft_invite', data, (response: { status: string }) => {
      if (response.status !== 'success') setError(validateError(response));
      else props.closeModal();
    });
  };

  const prevIsDisabled = cursor <= 0;
  const nextIsDisabled = users.length < take;

  return (
    <div className="flex w-80 flex-col border-2 border-solid border-white bg-black">
      <FTH3>invite to private room</FTH3>
      <div className="flex flex-row p-2">
        <div className="flex w-full min-w-0 flex-col">
          <Suspense fallback={<InvitePrivateUserListLoading take={take} />}>
            <InvitePrivateUserList
              take={take}
              cursor={cursor}
              setCursor={setCursor}
              isFetched={isFetched}
              setIsFetched={setIsFetched}
              users={users}
              setUsers={setUsers}
              submit={submit}
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
    </div>
  );
};
