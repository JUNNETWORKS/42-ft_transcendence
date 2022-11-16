import { useMemo, useState } from 'react';
import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Link } from 'react-router-dom';
import { SayCard } from '@/components/CommandCard';
import { Icons } from '@/icons';
import { Modal } from '@/components/Modal';
import { ChatRoomSettingCard, RoomTypeIcon } from './RoomSetting';
import { InlineIcon } from '@/hocs/InlineIcon';
import { dataAtom } from '@/stores/structure';
import { ChatMessageCard } from '@/components/ChatMessageCard';
import { useAtom } from 'jotai';

const ChatRoomMemberCard = (
  props: {
    you: TD.ChatUserRelation | null;
    room: TD.ChatRoom;
    member: TD.ChatUserRelation;
  } & TD.MemberOperations
) => {
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);
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
  const isBlocking = !!blockingUsers.find((u) => props.member.userId === u.id);
  const userTypeCap = () => {
    if (isOwner) {
      return <Icons.Chat.Owner style={{ display: 'inline' }} />;
    } else if (isAdmin) {
      return <Icons.Chat.Admin style={{ display: 'inline' }} />;
    }
    return '';
  };
  const link_path = isYou ? '/me' : `/user/${props.member.userId}`;
  return (
    <div className="flex flex-row">
      <div
        className="shrink grow cursor-pointer hover:bg-teal-700"
        key={props.member.userId}
        style={{
          ...(isYou ? { fontWeight: 'bold' } : {}),
        }}
      >
        <Link className="block" to={link_path}>
          {userTypeCap()}{' '}
          {isBlocking
            ? `${props.member.user.displayName}(Blocking)`
            : props.member.user.displayName}
        </Link>
      </div>

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
    </div>
  );
};

const ChatRoomMessagesList = (props: { messages: TD.ChatRoomMessage[] }) => {
  return (
    <>
      {props.messages.map((data: TD.ChatRoomMessage) => (
        <ChatMessageCard key={data.id} message={data} />
      ))}
    </>
  );
};

const ChatRoomMembersList = (
  props: {
    you: TD.ChatUserRelation | null;
    room: TD.ChatRoom;
    members: TD.UserRelationMap;
  } & TD.MemberOperations
) => {
  const computed = {
    members: useMemo(() => {
      const mems: TD.ChatUserRelation[] = [];
      const you = props.you ? props.members[props.you.userId] : null;
      if (you) {
        mems.push(you);
      }
      Utils.keys(props.members).forEach((id) => {
        const m = props.members[id];
        if (props.you?.userId === m.userId) {
          return;
        }
        mems.push(m);
      });
      return mems;
    }, [props.you, props.members]),
  };

  return (
    <div className="flex h-full flex-col">
      <FTH3 className="shrink-0 grow-0">Members</FTH3>
      <div className="shrink grow">
        {computed.members.map((member) => {
          return (
            <div key={member.userId}>
              <ChatRoomMemberCard
                member={member}
                {...Utils.omit(props, 'members')}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChatRoomView = (props: {
  room: TD.ChatRoom;
  memberOperations: TD.MemberOperations;
  you: TD.ChatUserRelation | null;
  say: (content: string) => void;
  room_messages: (roomId: number) => TD.ChatRoomMessage[];
  room_members: (roomId: number) => TD.UserRelationMap | null;
}) => {
  const isOwner = props.room.ownerId === props.you?.userId;
  const [isOpen, setIsOpen] = useState(false);
  const [members] = dataAtom.useMembersInRoom(props.room.id);

  const closeModal = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };
  const TypeIcon = RoomTypeIcon[props.room.roomType];
  return (
    <>
      <Modal closeModal={closeModal} isOpen={isOpen}>
        <ChatRoomSettingCard
          key={props.room.id}
          room={props.room}
          onSucceeded={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      <div className="flex h-full flex-row border-2 border-solid border-white p-2">
        <div className="flex h-full shrink grow flex-col overflow-hidden">
          {/* タイトルバー */}
          <FTH3>
            <InlineIcon i={<TypeIcon />} />
            {props.room.roomName}
            {!isOwner ? (
              <></>
            ) : (
              <FTButton onClick={openModal}>
                <Icons.Setting className="inline" />
              </FTButton>
            )}
          </FTH3>
          {/* 今フォーカスしているルームのメッセージ */}
          <div className="shrink grow overflow-scroll border-2 border-solid border-white">
            <ChatRoomMessagesList
              messages={props.room_messages(props.room.id)}
            />
          </div>
          <div className="shrink-0 grow-0 border-2 border-solid border-white p-2">
            {/* 今フォーカスしているルームへの発言 */}
            <div className="flex flex-row border-2 border-solid border-white p-2">
              <SayCard sender={props.say} />
            </div>
          </div>
        </div>
        <div className="shrink-0 grow-0 basis-[20em]">
          <ChatRoomMembersList
            you={props.you}
            room={props.room}
            members={members}
            {...props.memberOperations}
          />
        </div>
      </div>
    </>
  );
};
