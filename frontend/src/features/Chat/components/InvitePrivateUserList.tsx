import { displayUser } from '@/typedef';

export const InvitePrivateUserList = (props: {
  url: string;
  users: displayUser[];
  setUsers: React.Dispatch<React.SetStateAction<displayUser[]>>;
}) => {
  if (props.users.length === 0) {
    throw (async () => {
      const res = await fetch(props.url);
      const json = await res.json();
      console.log('res:', json);
      props.setUsers(json as displayUser[]);
    })();
  }

  return (
    <div className="flex min-w-0 flex-col">
      {props.users.map((user) => {
        return (
          <div
            className="w-full overflow-hidden text-ellipsis border-2 border-solid border-white bg-black p-1"
            key={user.id}
          >
            {user.displayName}
          </div>
        );
      })}
    </div>
  );
};
