import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';

import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import { compact } from '@/utils';

import { AdminOperationBar } from './ChatMemberCard';
import { PopoverUserCard } from './PopoverUserCard';

type ContentProp = {
  message: TD.ChatRoomMessage;
  PrimaryChild: () => JSX.Element;
  SecondaryChild?: () => JSX.Element;
};

const Content = ({ message, PrimaryChild, SecondaryChild }: ContentProp) => {
  const messageType = message.messageType;
  const nameButton = <PrimaryChild />;
  const targetButton = SecondaryChild ? <SecondaryChild /> : null;

  switch (messageType) {
    case 'OPENED':
      return (
        <>
          <InlineIcon i={<Icons.Chat.System.Opened />} />
          {nameButton}さんがルームを作成しました -
        </>
      );
    case 'UPDATED': {
      const diff = message.subpayload || {};
      const nameDiff = diff.roomName ? `ルーム名 → ${diff.roomName}` : null;
      const typeDiff = diff.roomType ? `種別 → ${diff.roomType}` : null;
      const diffText = compact([nameDiff, typeDiff]);
      if (diffText.length === 0) {
        return null;
      }
      return (
        <>
          <InlineIcon i={<Icons.Chat.System.Updated />} />
          {nameButton}さんがルームを更新しました: {diffText.join(', ')} -
        </>
      );
    }
    case 'JOINED':
      return (
        <>
          <InlineIcon i={<Icons.Chat.System.Joined />} />
          {nameButton}さんが入室しました -
        </>
      );
    case 'LEFT':
      return (
        <>
          <InlineIcon i={<Icons.Chat.System.Left />} />
          {nameButton}さんが退出しました -
        </>
      );

    case 'NOMMINATED':
      return (
        <>
          <InlineIcon i={<Icons.Chat.Operation.Nomminate />} />
          {nameButton}さんが{targetButton}さんを管理者に指定しました -
        </>
      );

    case 'BANNED':
      return (
        <>
          <InlineIcon i={<Icons.Chat.Operation.Ban />} />
          {nameButton}さんが{targetButton}さんの入室を禁止しました -
        </>
      );

    case 'KICKED':
      return (
        <>
          <InlineIcon i={<Icons.Chat.Operation.Kick />} />
          {nameButton}さんが{targetButton}さんを強制退出させました -
        </>
      );

    case 'MUTED':
      return (
        <>
          <InlineIcon i={<Icons.Chat.Operation.Mute />} />
          {nameButton}さんが{targetButton}さんをミュートしました -
        </>
      );

    default:
      return <span>not implemented</span>;
  }
};

/**
 * システムメッセージを表示するコンポーネント
 */
export const ChatSystemMessageCard = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  message: TD.ChatRoomMessage;
  userId: number;
  member?: TD.ChatUserRelation;
  members: TD.UserRelationMap;
  memberOperations: TD.MemberOperations;
  id: string;
}) => {
  const messageType = props.message.messageType;
  const user = useUserDataReadOnly(props.userId);
  const targetUser = useUserDataReadOnly(props.message.secondaryUserId || -1);
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
  if (!messageType) {
    return null;
  }
  const isBlocked =
    blockingUsers && blockingUsers.find((u) => u.id === props.message.userId);
  if (!user || isBlocked) {
    return null;
  }
  return (
    <div
      className="flex flex-row items-start px-2 py-1 text-sm text-gray-400 hover:bg-gray-800"
      key={props.message.id}
      id={props.id}
    >
      <div className="flex shrink grow flex-col">
        <div className="flex max-w-[12em] shrink-0 grow-0 flex-row">
          <div className="m-[1px] shrink-0 grow-0 px-[2px] py-0">
            <Content
              message={props.message}
              PrimaryChild={() => (
                <PopoverUserCard user={user}>
                  <AdminOperationBar {...props} />
                </PopoverUserCard>
              )}
              SecondaryChild={() =>
                targetUser && (
                  <PopoverUserCard user={targetUser}>
                    <AdminOperationBar
                      {...props}
                      member={props.members[targetUser.id]}
                    />
                  </PopoverUserCard>
                )
              }
            />
          </div>
          <div className="shrink-0 grow-0 px-[4px]">
            {dayjs(props.message.createdAt).format('MM/DD HH:mm:ss')}
          </div>
        </div>
      </div>
    </div>
  );
};
