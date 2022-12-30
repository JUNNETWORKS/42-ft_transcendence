import { ReactNode, Suspense, useState } from 'react';
import { Oval } from 'react-loader-spinner';

import { FillerBlock } from '@/components/FillerBlock';
import { FTButton } from '@/components/FTBasicComponents';
import { UserAvatar } from '@/components/UserAvater';
import { useStoredCredential } from '@/features/DevAuth/hooks';
import { Icons } from '@/icons';
import { useUpdateUser, useUserDataReadOnly } from '@/stores/store';
import { displayUser } from '@/typedef';

type Phase = 'Neutral' | 'Fetched' | 'Failed';

const Params = {
  itemHeight: 60,
};

type EnclosureProp = {
  height: number;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  list?: boolean;
};

// Enclosure が内包するもの:
// - クリック可能なユーザ
// - クリックできないユーザ
// - 空行
// - no user メッセージ
// - spinner
const Enclosure = ({
  height,
  onClick,
  disabled,
  children,
  list,
}: EnclosureProp) => {
  const baseClassName =
    'flex w-full shrink-0 grow-0 justify-center items-center bg-black p-1';
  const className = `${baseClassName} ${
    children && list ? 'hover:bg-gray-800' : ''
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
      <FillerBlock icon={Icons.NormalFace} message="No More Users" />
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
      list
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
  phase: Phase;
  setPhase: React.Dispatch<React.SetStateAction<Phase>>;
  users: displayUser[];
  setUsers: React.Dispatch<React.SetStateAction<displayUser[]>>;
  isDisabled?: (targetUser: displayUser) => boolean;
  onSelect: (targetUser: displayUser) => void;
};

const ActualUserSelectList = (props: ActualProp) => {
  const userUpdater = useUpdateUser();
  const [credential] = useStoredCredential();
  if (!credential) {
    return null;
  }
  if (props.phase === 'Neutral') {
    const url = props.makeUrl(props.take, props.cursor);
    throw (async () => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            Authorization: `Bearer ${credential.token}`,
          },
        });
        const json = (await res.json()) as displayUser[];
        props.setPhase('Fetched');
        userUpdater.addMany(json);
        props.setUsers(json);
      } catch (e) {
        props.setPhase('Failed');
      }
    })();
  }
  if (props.phase === 'Failed') {
    return (
      <Enclosure height={Params.itemHeight * props.take}>
        <FillerBlock icon={Icons.UnhappyFace} message="Failed">
          <FTButton onClick={() => props.setPhase('Neutral')}>Retry</FTButton>
        </FillerBlock>
      </Enclosure>
    );
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
  const [phase, setPhase] = useState<Phase>('Neutral');
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
              phase={phase}
              setPhase={setPhase}
              users={users}
              setUsers={setUsers}
            />
          </Suspense>
        </div>
      </div>
      <div className="flex flex-row justify-around p-2">
        <FTButton
          onClick={() => {
            setPhase('Neutral');
            const newCursor = cursor - take >= 0 ? cursor - take : 0;
            setCursor(newCursor);
          }}
          disabled={prevIsDisabled}
        >
          {'<-'}
        </FTButton>
        <FTButton
          onClick={() => {
            setPhase('Neutral');
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
