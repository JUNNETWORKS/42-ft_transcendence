import { FTButton, FTH4 } from '@/components/FTBasicComponents';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';
import { useUserCard } from '@/stores/control';
import { useUserDataReadOnly } from '@/stores/store';
import * as TD from '@/typedef';

import { PopoverUserCard } from './PopoverUserCard';
import { UserAvatar } from './UserAvater';

export const AdminOperationBar = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  member?: TD.ChatUserRelation;
  memberOperations: TD.MemberOperations;
}) => {
  if (!props.member) {
    return null;
  }
  const member = props.member;
  const areYouOwner = props.you?.userId === props.room.ownerId;
  const areYouAdmin = props.you?.memberType === 'ADMIN';
  const areYouAdminLike = areYouOwner;
  const isYou = props.you?.userId === props.member.user.id;
  const isAdmin = member.memberType === 'ADMIN';
  const isOwner = props.room.ownerId === member.user.id;
  const isAdminableFor = !isYou && (areYouOwner || (areYouAdmin && !isOwner));
  if (!isAdminableFor) {
    return null;
  }
  const isNomminatable = !isAdmin && !isOwner && !isYou && areYouAdminLike;
  const isBannable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;
  const isKickable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;
  const isMutable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;
  const ops = props.memberOperations;

  return (
    <>
      <FTH4>Admin Operation</FTH4>
      <div className="flex flex-row px-1 py-4">
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isNomminatable}
          onClick={() =>
            ops.onNomminateClick ? ops.onNomminateClick(member) : null
          }
        >
          <Icons.Chat.Operation.Nomminate />
        </FTButton>
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isBannable}
          onClick={() => (ops.onBanClick ? ops.onBanClick(member) : null)}
        >
          <Icons.Chat.Operation.Ban />
        </FTButton>
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isKickable}
          onClick={() => (ops.onKickClick ? ops.onKickClick(member) : null)}
        >
          <Icons.Chat.Operation.Kick />
        </FTButton>
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isMutable}
          onClick={() => (ops.onMuteClick ? ops.onMuteClick(member) : null)}
        >
          <Icons.Chat.Operation.Mute />
        </FTButton>
      </div>
    </>
  );
};

export const ChatMemberCard = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  member: TD.ChatUserRelation;
  memberOperations: TD.MemberOperations;
}) => {
  const user = useUserDataReadOnly(props.member.userId);
  const isYou = props.you?.userId === props.member.user.id;
  const isAdmin = props.member.memberType === 'ADMIN';
  const isOwner = props.room.ownerId === props.member.user.id;

  const UserTypeCap = () => {
    if (isOwner) {
      return <InlineIcon i={<Icons.Chat.Owner />} />;
    } else if (isAdmin) {
      return <InlineIcon i={<Icons.Chat.Admin />} />;
    }
    return null;
  };
  const popoverContent = <AdminOperationBar {...props} />;
  const oc = useUserCard();
  const openCard = () => oc(user, popoverContent || null);
  const avatarButton = (
    <UserAvatar className="m-1 h-8 w-8" user={user} onClick={openCard} />
  );
  return (
    <div className="flex w-full cursor-pointer flex-row items-center hover:bg-teal-700">
      <div className="shrink-0 grow-0">
        <PopoverUserCard button={avatarButton}>
          {popoverContent}
        </PopoverUserCard>
      </div>
      <PopoverUserCard
        className="flex shrink grow flex-row items-center"
        button={
          <>
            <div className="shrink-0 grow-0 cursor-pointer" onClick={openCard}>
              <UserTypeCap />
            </div>
            <div
              className={`shrink grow cursor-pointer ${
                isYou ? 'font-bold' : ''
              } max-w-[12em] overflow-hidden text-ellipsis whitespace-nowrap text-left`}
              key={props.member.userId}
              style={{ wordBreak: 'keep-all' }}
              onClick={openCard}
            >
              {user.displayName}
            </div>
          </>
        }
      >
        {popoverContent}
      </PopoverUserCard>
    </div>
  );
};
