import * as TD from '@/typedef';
import { FTButton, FTH4 } from '@/components/FTBasicComponents';
import { Icons } from '@/icons';
import { UserAvatar } from './UserAvater';
import { useUserDataReadOnly } from '@/stores/store';
import { Popover } from '@headlessui/react';
import { useState } from 'react';
import { usePopper } from 'react-popper';
import { UserCard } from '@/features/User/UserCard';
import { InlineIcon } from '@/hocs/InlineIcon';

export const AdminOperationBar = (
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
  const isAdminableFor = !isYou && (areYouOwner || (areYouAdmin && !isOwner));
  if (!isAdminableFor) {
    return null;
  }
  const isNomminatable = !isAdmin && !isOwner && !isYou && areYouAdminLike;
  const isBannable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;
  const isKickable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;
  const isMutable = (areYouOwner || (areYouAdmin && !isOwner)) && !isYou;

  return (
    <>
      <FTH4>Admin Operation</FTH4>
      <div className="flex flex-row px-1 py-4">
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isNomminatable}
          onClick={() =>
            props.onNomminateClick ? props.onNomminateClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Nomminate />
        </FTButton>
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isBannable}
          onClick={() =>
            props.onBanClick ? props.onBanClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Ban />
        </FTButton>
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isKickable}
          onClick={() =>
            props.onKickClick ? props.onKickClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Kick />
        </FTButton>
        <FTButton
          className="mx-1 text-2xl disabled:opacity-50"
          disabled={!isMutable}
          onClick={() =>
            props.onMuteClick ? props.onMuteClick(props.member) : null
          }
        >
          <Icons.Chat.Operation.Mute />
        </FTButton>
      </div>
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
      return <InlineIcon i={<Icons.Chat.Owner />} />;
    } else if (isAdmin) {
      return <InlineIcon i={<Icons.Chat.Admin />} />;
    }
    return null;
  };
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'left-start',
  });
  return (
    <Popover className="relative">
      <Popover.Button
        className="flex w-full flex-row items-center hover:bg-teal-700"
        ref={setReferenceElement}
      >
        <div className="shrink-0 grow-0">
          <UserAvatar className="m-1 h-8 w-8" user={user} />
        </div>
        <UserTypeCap />
        <div
          className={`shrink grow cursor-pointer ${
            isYou ? 'font-bold' : ''
          } overflow-hidden text-ellipsis text-left`}
          key={props.member.userId}
        >
          {user.displayName}
        </div>
      </Popover.Button>

      <Popover.Panel
        className="absolute z-10 border-8 border-gray-500 bg-black/90"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <UserCard id={user.id}>
          <AdminOperationBar {...props} />
        </UserCard>
      </Popover.Panel>
    </Popover>
  );
};
