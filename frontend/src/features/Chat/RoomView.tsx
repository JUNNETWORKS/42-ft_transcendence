import { useMemo, useState } from 'react';
import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import * as dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { SayCard } from '@/components/CommandCard';
import { Icons } from '@/icons';
import { Modal } from '@/components/Modal';
import { ChatRoomSettingCard, RoomTypeIcon } from './RoomSetting';
import { InlineIcon } from '@/hocs/InlineIcon';

/**
 * メッセージを表示するコンポーネント
 */
const MessageCard = (props: { message: TD.ChatRoomMessage }) => {
  return (
    <div
      className="flex flex-col border-[1px] border-solid border-white p-2"
      key={props.message.id}
    >
      <div className="flex flex-row">
        <div className="m-[1px] bg-white px-[2px] py-0 text-black">
          {props.message.user.displayName}
        </div>
        <div className="pr-[4px]">
          {dayjs(props.message.createdAt).format('MM/DD HH:mm:ss')}
        </div>
        <div className="pr-[4px]">chatRoomId: {props.message.chatRoomId}</div>
      </div>
      <div>{props.message.content}</div>
    </div>
  );
};

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

const MemberCard = (
  props: {
    you: TD.ChatUserRelation | null;
    room: TD.ChatRoom;
    member: TD.ChatUserRelation;
  } & TD.MemberOperations
) => {
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
    <div className="flex flex-row">
      <div
        className={`shrink grow cursor-pointer hover:bg-teal-700 ${
          isYou ? 'font-bold' : ''
        }`}
        key={props.member.userId}
      >
        <Link className="block" to={link_path}>
          {<UserTypeCap />} {props.member.user.displayName}
        </Link>
      </div>
      <AdminOperationBar {...props} />
    </div>
  );
};

const MessagesList = (props: { messages: TD.ChatRoomMessage[] }) => {
  return (
    <>
      {props.messages.map((data: TD.ChatRoomMessage) => (
        <MessageCard key={data.id} message={data} />
      ))}
    </>
  );
};

const MembersList = (
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
        {computed.members.map((member) => (
          <div key={member.userId}>
            <MemberCard member={member} {...Utils.omit(props, 'members')} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChatRoomView = (props: {
  room: TD.ChatRoom;
  memberOperations: TD.MemberOperations;
  you: TD.ChatUserRelation | null;
  say: (content: string) => void;
  roomMessages: (roomId: number) => TD.ChatRoomMessage[];
  roomMembers: (roomId: number) => TD.UserRelationMap | null;
}) => {
  const isOwner = props.room.ownerId === props.you?.userId;
  const [isOpen, setIsOpen] = useState(false);

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
            {isOwner && (
              <FTButton onClick={openModal}>
                <Icons.Setting className="inline" />
              </FTButton>
            )}
          </FTH3>
          {/* 今フォーカスしているルームのメッセージ */}
          <div className="shrink grow overflow-scroll border-2 border-solid border-white">
            <MessagesList messages={props.roomMessages(props.room.id)} />
          </div>
          <div className="shrink-0 grow-0 border-2 border-solid border-white p-2">
            {/* 今フォーカスしているルームへの発言 */}
            <div className="flex flex-row border-2 border-solid border-white p-2">
              <SayCard sender={props.say} />
            </div>
          </div>
        </div>
        <div className="shrink-0 grow-0 basis-[20em]">
          <MembersList
            you={props.you}
            room={props.room}
            members={props.roomMembers(props.room.id) || {}}
            {...props.memberOperations}
          />
        </div>
      </div>
    </>
  );
};
