import { ReactNode, Suspense, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import { FTButton } from '@/components/FTBasicComponents';
import { UserAvatar } from '@/components/UserAvater';
import { useUpdateUser, useUserDataReadOnly } from '@/stores/store';
import { displayUser } from '@/typedef';

const Params = {
  itemHeight: 60,
};

type EnclosureProp = {
  height: number;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
};

// Enclosure が内包するもの:
// - クリック可能なユーザ
// - クリックできないユーザ
// - 空行
// - no user メッセージ
// - spinner
const Enclosure = ({ height, onClick, disabled, children }: EnclosureProp) => {
  const baseClassName = 'flex w-full shrink-0 grow-0 items-center bg-black p-1';
  const className = `${baseClassName} ${
    children && !disabled ? 'hover:bg-gray-800' : ''
  } ${disabled ? ' opacity-50' : ''} ${onClick ? 'cursor-pointer' : ''}`;
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
const UserSelectListLoading = ({ take }: PlaceholderProp) => {
  return (
    <Enclosure height={Params.itemHeight * take}>
      <div className="flex w-full items-center justify-center">
        <Oval
          height={Params.itemHeight}
          width={Params.itemHeight}
          color="#ffffff"
          visible={true}
          secondaryColor="#eeeeee"
        />
      </div>
    </Enclosure>
  );
};

/**
 * 取得ユーザ数が0だった場合に「もうユーザがいない」ことを知らせるコンポーネント
 */
const BlankList = ({ take }: PlaceholderProp) => {
  return (
    <Enclosure height={Params.itemHeight * take}>
      <p className="shrink grow text-center">no more users</p>
    </Enclosure>
  );
};

type ItemProp = {
  user?: displayUser;
  isDisabled?: boolean;
  onSelect: (targetUser: displayUser) => void;
};

/**
 * `user`がない場合は枠線なしで隙間だけ開ける
 */
const ListItem = ({ user, isDisabled, onSelect }: ItemProp) => {
  const u = useUserDataReadOnly(user ? user.id : NaN);
  const content = () => {
    if (!u) {
      return;
    }
    return (
      <>
        <UserAvatar className={`m-1 h-10 w-10`} user={u} />
        <p className={`shrink grow overflow-hidden text-ellipsis`}>
          {u.displayName}
        </p>
      </>
    );
  };
  return (
    <Enclosure
      height={Params.itemHeight}
      disabled={isDisabled}
      onClick={user && !isDisabled ? () => onSelect(user) : undefined}
    >
      {content()}
    </Enclosure>
  );
};

type ActualProp = {
  makeUrl: (take: number, cursor: number) => string;
  take: number;
  cursor: number;
  setCursor: React.Dispatch<React.SetStateAction<number>>;
  isFetched: boolean;
  setIsFetched: React.Dispatch<React.SetStateAction<boolean>>;
  users: displayUser[];
  setUsers: React.Dispatch<React.SetStateAction<displayUser[]>>;
  isDisabled?: (targetUser: displayUser) => boolean;
  onSelect: (targetUser: displayUser) => void;
};

const ActualUserSelectList = (props: ActualProp) => {
  const userUpdater = useUpdateUser();
  if (!props.isFetched) {
    const url = props.makeUrl(props.take, props.cursor);
    throw (async () => {
      const res = await fetch(url);
      const json = (await res.json()) as displayUser[];
      console.log('res:', json);
      props.setIsFetched(true);
      userUpdater.addMany(json);
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
        const isDisabled = user && props.isDisabled && props.isDisabled(user);
        return (
          <ListItem
            key={user ? user.id : `nothing-${i}`}
            onSelect={props.onSelect}
            isDisabled={isDisabled}
            user={user}
          />
        );
      })}
    </>
  );
};

type Prop = {
  makeUrl: (take: number, cursor: number) => string;
  take: number;
  isDisabled?: (targetUser: displayUser) => boolean;
  onSelect: (targetUser: displayUser) => void;
};

export const UserSelectList = (props: Prop) => {
  const take = props.take;
  const [isFetched, setIsFetched] = useState(false);
  const [users, setUsers] = useState<displayUser[]>([]);
  const [cursor, setCursor] = useState(0);
  const prevIsDisabled = cursor <= 0;
  const nextIsDisabled = users.length < take;

  return (
    <>
      <div className="flex flex-row p-2">
        <div className="flex w-full min-w-0 flex-col">
          <Suspense fallback={<UserSelectListLoading take={take} />}>
            <ActualUserSelectList
              {...props}
              cursor={cursor}
              setCursor={setCursor}
              isFetched={isFetched}
              setIsFetched={setIsFetched}
              users={users}
              setUsers={setUsers}
            />
          </Suspense>
        </div>
      </div>
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
    </>
  );
};
