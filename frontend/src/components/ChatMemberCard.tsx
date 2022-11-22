import * as TD from '@/typedef';
import { FTButton } from '@/components/FTBasicComponents';
import { Link } from 'react-router-dom';
import { Icons } from '@/icons';
import { UserAvatar } from './UserAvater';
import { useUserDataReadOnly } from '@/stores/store';

const AdminOperationBar = (
  props: {
    you: TD.ChatUserRelation | null;
    room: TD.ChatRoom;
    member: TD.ChatUserRelation;
  } & TD.MemberOperations
) => {
  const areYouOwner = props.you?.userId === props.room.ownerId;
  const areYouAdmin = props.you?.memberType === 'ADMIN';
  const areYouAdminLike = areYouOwner;
  const isYou = props.you?.userId === props.member.user.id;
  const isAdmin = props.member.memberType === 'ADMIN';
  const isOwner = props.room.ownerId === props.member.user.id;
  const isNomminatable = !isAdmin && !isOwner && !isYou && areYouAdminLike;
  const isBannable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;
  const isKickable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;
  const isMutable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;

  return (
    <>
      {isNomminatable && (
        <FTButton
          onClick={() =>
            props.onNomminateClick ? props.onNomminateClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Nomminate />
        </FTButton>
      )}
      {isBannable && (
        <FTButton
          onClick={() =>
            props.onBanClick ? props.onBanClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Ban />
        </FTButton>
      )}
      {isKickable && (
        <FTButton
          onClick={() =>
            props.onKickClick ? props.onKickClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Kick />
        </FTButton>
      )}
      {isMutable && (
        <FTButton
          onClick={() =>
            props.onMuteClick ? props.onMuteClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Mute />
        </FTButton>
      )}
    </>
  );
};

export const ChatMemberCard = (
  props: {
    you: TD.ChatUserRelation | null;
    room: TD.ChatRoom;
    member: TD.ChatUserRelation;
  } & TD.MemberOperations
) => {
  const user = useUserDataReadOnly(props.member.userId);
  const isYou = props.you?.userId === props.member.user.id;
  const isAdmin = props.member.memberType === 'ADMIN';
  const isOwner = props.room.ownerId === props.member.user.id;

  const UserTypeCap = () => {
    if (isOwner) {
      return <Icons.Chat.Owner style={{ display: 'inline' }} />;
    } else if (isAdmin) {
      return <Icons.Chat.Admin style={{ display: 'inline' }} />;
    }
    return null;
  };
  const link_path = isYou ? '/me' : `/user/${props.member.userId}`;
  return (
    <div className="flex flex-row items-center hover:bg-teal-700">
      <Link className="shrink-0 grow-0" to={link_path}>
        <UserAvatar className="m-1 h-8 w-8" user={user} />
      </Link>
      <Link
        className={`shrink grow cursor-pointer ${
          isYou ? 'font-bold' : ''
        } overflow-hidden text-ellipsis`}
        key={props.member.userId}
        to={link_path}
      >
        {<UserTypeCap />} {user.displayName}
      </Link>
    </div>
  );
};
