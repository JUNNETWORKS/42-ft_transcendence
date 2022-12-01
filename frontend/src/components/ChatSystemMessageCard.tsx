import { UserCard } from '@/features/User/UserCard';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import { compact } from '@/utils';
import { Icons } from '@/icons';
import * as dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { AdminOperationBar } from './ChatMemberCard';
import { PopoverUserName } from './PopoverUserName';

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
  const nameButton = (
    <PopoverUserName user={user}>
      <UserCard id={user.id}>
        <AdminOperationBar {...props} />
      </UserCard>
    </PopoverUserName>
  );
  const targetButton = targetUser ? (
    <PopoverUserName user={targetUser}>
      <UserCard id={targetUser.id}>
        <AdminOperationBar {...props} member={props.members[targetUser.id]} />
      </UserCard>
    </PopoverUserName>
  ) : null;
  const content = () => {
    switch (messageType) {
      case 'OPENED':
        return (
          <>
            <InlineIcon i={<Icons.Chat.System.Opened />} />
            {nameButton}さんがルームを作成しました -
          </>
        );
      case 'UPDATED': {
        const diff = props.message.subpayload || {};
        const nameDiff = diff.roomName ? `ルーム名 → ${diff.roomName}` : null;
        const typeDiff = diff.roomType ? `種別 → ${diff.roomType}` : null;
        const diffText = compact([nameDiff, typeDiff]);
        if (!diffText) {
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
        if (!targetButton) {
          return null;
        }
        return (
          <>
            <InlineIcon i={<Icons.Chat.Operation.Nomminate />} />
            {nameButton}さんが{targetButton}さんを管理者に指定しました -
          </>
        );

      case 'BANNED':
        if (!targetButton) {
          return null;
        }
        return (
          <>
            <InlineIcon i={<Icons.Chat.Operation.Ban />} />
            {nameButton}さんが{targetButton}さんの入室を禁止しました -
          </>
        );

      case 'KICKED':
        if (!targetButton) {
          return null;
        }
        return (
          <>
            <InlineIcon i={<Icons.Chat.Operation.Kick />} />
            {nameButton}さんが{targetButton}さんを強制退出させました -
          </>
        );

      case 'MUTED':
        if (!targetButton) {
          return null;
        }
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
  return (
    <div
      className="flex flex-row items-start px-2 py-1 text-sm text-gray-400"
      key={props.message.id}
      id={props.id}
    >
      <div className="flex shrink grow flex-col">
        <div className="flex max-w-[12em] shrink-0 grow-0 flex-row">
          <div className="m-[1px] shrink-0 grow-0 px-[2px] py-0">
            {content()}
          </div>
          <div className="shrink-0 grow-0 px-[4px]">
            {dayjs(props.message.createdAt).format('MM/DD HH:mm:ss')}
          </div>
        </div>
      </div>
    </div>
  );
};
