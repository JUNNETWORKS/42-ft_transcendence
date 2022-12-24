import { useAtom } from 'jotai';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { FTH3 } from '@/components/FTBasicComponents';
import { authAtom, chatSocketAtom } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import { displayUser, ChatRoom } from '@/typedef';

import { UserSelectList } from './UserSelectList';

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
  const take = 5;
  const [membersInRoom] = useAtom(dataAtom.membersInRoomAtom);
  const members = membersInRoom[props.room.id];
  const isDisabled = (user: displayUser) => !!members && !!members[user.id];
  const [error, setError] = useState('');

  if (!personalData || !mySocket) return null;

  const submit = (targetUser: displayUser) => {
    const data = {
      roomId: props.room.id,
      users: [targetUser.id],
    };
    console.log(data);
    setError('');
    mySocket.emit('ft_invite', data, (response: { status: string }) => {
      if (response.status !== 'success') setError(validateError(response));
      else {
        props.closeModal();
        toast('ユーザーの招待に成功しました。');
      }
    });
  };

  return (
    <div className="flex w-80 flex-col border-2 border-solid border-white bg-black">
      <FTH3>invite to private room</FTH3>
      <UserSelectList
        makeUrl={(take, cursor) =>
          `http://localhost:3000/users?take=${take}&cursor=${cursor}`
        }
        take={take}
        isDisabled={isDisabled}
        onSelect={submit}
      />
      <div className="text-red-400">{error !== '' ? error : '　'}</div>
    </div>
  );
};
