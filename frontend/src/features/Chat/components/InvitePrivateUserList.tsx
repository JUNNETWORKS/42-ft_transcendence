import { displayUser } from '@/typedef';

export const InvitePrivateUserList = (props: {
  url: string;
  users: displayUser[];
  setUsers: React.Dispatch<React.SetStateAction<displayUser[]>>;
}) => {
  if (props.users.length === 0) {
    throw (async () => {
      const res = await fetch(props.url, {
        method: 'GET',
        mode: 'cors',
      });
      console.log('res:', await res.json());
      props.setUsers(await res.json());
    })();
  }

  return (
    <div>
      {props.users.map((user) => {
        return <div key={user.id}>{user.displayName}</div>;
      })}
    </div>
  );
};
