import { ReactNode } from 'react';
import { Oval } from 'react-loader-spinner';

import { displayUser } from '@/typedef';

const Params = {
  itemHeight: 45,
};

type EnclosureProp = {
  height: number;
  onClick?: () => void;
  children?: ReactNode;
};

const Enclosure = ({ height, onClick, children }: EnclosureProp) => {
  const baseClassName = 'flex w-full shrink-0 grow-0 items-center bg-black p-1';
  const className = `${baseClassName} ${
    children ? 'border-2 border-solid border-white' : ''
  } ${onClick ? 'cursor-pointer' : 'justify-center'}`;
  return (
    <div
      className={className}
      style={{ flexBasis: `${height}px` }}
      onClick={() => {
        onClick ? onClick() : null;
      }}
    >
      {children}
    </div>
  );
};

type PlaceholderProp = {
  take: number;
};

/**
 * ローディング中に高さをガチャらせないためのコンポーネント
 */
export const InvitePrivateUserListLoading = ({ take }: PlaceholderProp) => {
  return (
    <Enclosure height={Params.itemHeight * take}>
      <Oval
        height={40}
        width={40}
        color="#ffffff"
        visible={true}
        secondaryColor="#eeeeee"
      />
    </Enclosure>
  );
};

/**
 * 取得ユーザ数が0だった場合に「もうユーザがいない」ことを知らせるコンポーネント
 */
const BlankList = ({ take }: PlaceholderProp) => {
  return (
    <Enclosure height={Params.itemHeight * take}>
      <p>no more users</p>
    </Enclosure>
  );
};

type ItemProp = {
  submit: (targetUser: number) => void;
  user?: displayUser;
};

/**
 * `user`がない場合は枠線なしで隙間だけ開ける
 */
const ListItem = ({ submit, user }: ItemProp) => {
  return (
    <Enclosure
      height={Params.itemHeight}
      onClick={user ? () => submit(user.id) : undefined}
    >
      {user && (
        <p className="overflow-hidden text-ellipsis">{user.displayName}</p>
      )}
    </Enclosure>
  );
};

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

  if (props.users.length === 0) {
    return <BlankList take={props.take} />;
  }
  const arr: number[] = [];
  for (let i = 0; i < props.take; ++i) {
    arr.push(i);
  }
  return (
    <>
      {arr.map((_, i) => {
        const user = props.users[i];
        return (
          <ListItem
            key={user ? user.id : `nothing-${i}`}
            submit={props.submit}
            user={user}
          />
        );
      })}
    </>
  );
};
