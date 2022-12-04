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
      const json = await res.json();
      console.log('res:', json);
      props.setUsers(json as displayUser[]);
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
