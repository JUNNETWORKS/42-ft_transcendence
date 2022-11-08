import { chatSocketAtom } from '@/stores/auth';
import { FTButton, FTH1, FTH4 } from '@/components/FTBasicComponents';
import { useUserData } from '@/stores/store';
import { useAtom } from 'jotai';
import { useParams } from 'react-router-dom';
import * as dayjs from 'dayjs';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { Icons } from '@/icons';
import * as TD from '@/typedef';
import { structureAtom } from '@/stores/structure';

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
      {props.isFriend ? 'Unollow' : 'Follow'}
    </FTButton>
  );
};

type UserCardProp = {
  user: TD.User;
};
const UserCard = ({ user }: UserCardProp) => {
  const userId = user.id;
  const [friends] = useAtom(structureAtom.friends);
  // フレンドかどうか
  const isFriend = !!friends.find((f) => f.id === userId);
  return (
    <>
      <FTH1 className="text-4xl font-bold" style={{ padding: '4px' }}>
        <div className="inline-block align-text-bottom">
          <OnlineStatusDot key={user.id} user={user} />
        </div>
        {user.displayName}
        {isFriend && <Icons.User.Friend className="inline" />}
      </FTH1>
      <div className="flex flex-col gap-2">
        <FTH4>id</FTH4>
        <div>{user.id}</div>
        <FTH4>name</FTH4>
        <div>{user.displayName}</div>
        <FTH4>heartbeat time</FTH4>
        <div>
          {user.time ? dayjs(user.time).format('MM/DD HH:mm:ss') : 'offline'}
        </div>

        <div>
          <FollowButton userId={user.id} isFriend={isFriend} />
        </div>
      </div>
    </>
  );
};

export const UserView = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  const [fetchState, user] = useUserData(userId);

  const presentator = (() => {
    console.log('personalData', fetchState, user);
    switch (fetchState) {
      case 'Fetched': {
        if (user) {
          return <UserCard user={user} />;
        }
      }
    }
    return <p>{fetchState}</p>;
  })();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        {presentator}
      </div>
    </div>
  );
};
