import { displayUser } from '@/typedef';

type InvitePrivateUserListProps = {
  take: number;
  cursor: number;
  setCursor: React.Dispatch<React.SetStateAction<number>>;
  isFetched: boolean;
  setIsFetched: React.Dispatch<React.SetStateAction<boolean>>;
  users: displayUser[];
  setUsers: React.Dispatch<React.SetStateAction<displayUser[]>>;
  submit: (targetUser: number) => void;
};

export const InvitePrivateUserList = (props: InvitePrivateUserListProps) => {
  if (!props.isFetched) {
    const url = `http://localhost:3000/users?take=${props.take}&cursor=${props.cursor}`;
    throw (async () => {
      const res = await fetch(url);
      const json = (await res.json()) as displayUser[];
      console.log('res:', json);
      props.setIsFetched(true);
      props.setUsers(json);
    })();
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      {props.users.map((user) => {
        return (
          <div
            onClick={() => props.submit(user.id)}
            className="w-full cursor-pointer overflow-hidden text-ellipsis border-2 border-solid border-white bg-black p-1"
            key={user.id}
          >
            {user.displayName}
          </div>
        );
      })}
    </div>
  );
};
