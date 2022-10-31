import { chatSocketAtom, userAtoms } from '@/stores/atoms';
import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { usePersonalData } from '@/hooks';
import { useAtom } from 'jotai';
import { FaUserFriends } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { UserPersonalData } from '@/types';

const FollowButton = (props: { userId: number; isFriend: boolean }) => {
  const [mySocket] = useAtom(chatSocketAtom);
  if (!mySocket) {
    return null;
  }
  const command = {
    follow: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_follow', data);
      mySocket.emit('ft_follow', data);
    },
    unfollow: (targetId: number) => {
      const data = {
        userId: targetId,
      };
      console.log('ft_unfollow', data);
      mySocket.emit('ft_unfollow', data);
    },
  };
  return (
    <FTButton
      className="w-20"
      onClick={() =>
        (props.isFriend ? command.unfollow : command.follow)(props.userId)
      }
    >
      {props.isFriend ? 'Follow' : 'Unfollow'}
    </FTButton>
  );
};

type UserCardProp = {
  personalData: UserPersonalData;
};
const UserCard = ({ personalData }: UserCardProp) => {
  const userId = personalData.id;
  const [friends] = useAtom(userAtoms.friends);
  // フレンドかどうか
  console.log(userId, friends);
  const isFriend = !!friends.find((f) => f.id === userId);
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        {personalData.displayName}
        {isFriend && <FaUserFriends className="inline" />}
      </FTH1>
      <div className="flex flex-col gap-2">
        <FTH4>id</FTH4>
        <div>{personalData.id}</div>
        <FTH4>name</FTH4>
        <div>{personalData.displayName}</div>

        <div>
          <FollowButton userId={personalData.id} isFriend={isFriend} />
        </div>
      </div>
    </>
  );
};

export const UserView = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  const [fetchState, personalData] = usePersonalData(userId);

  const presentator = () => {
    switch (fetchState) {
      case 'Fetched': {
        if (personalData) {
          return <UserCard personalData={personalData} />;
        }
      }
    }
    return <p>{fetchState}</p>;
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        {presentator()}
      </div>
    </div>
  );
};
