import { useMemo } from 'react';
import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import * as dayjs from 'dayjs';
import * as RIFa from 'react-icons/fa';
import * as RIIo from 'react-icons/im';
import * as RIBS from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { SayCard } from '@/components/CommandCard';

/**
 * メッセージを表示するコンポーネント
 */
const ChatRoomMessageCard = (props: { message: TD.ChatRoomMessage }) => {
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

const ChatRoomMemberCard = (
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

  const userTypeCap = () => {
    if (isOwner) {
      return <RIFa.FaCrown style={{ display: 'inline' }} />;
    } else if (isAdmin) {
      return <RIFa.FaCog style={{ display: 'inline' }} />;
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
          {userTypeCap()} {props.member.user.displayName}
        </Link>
      </div>

      {isNomminatable && (
        <FTButton
          onClick={() =>
            props.onNomminateClick ? props.onNomminateClick(props.member) : null
          }
        >
          <RIFa.FaUserCog />
        </FTButton>
      )}
      {isBannable && (
        <FTButton
          onClick={() =>
            props.onBanClick ? props.onBanClick(props.member) : null
          }
        >
          <RIFa.FaBan />
        </FTButton>
      )}
      {isKickable && (
        <FTButton
          onClick={() =>
            props.onKickClick ? props.onKickClick(props.member) : null
          }
        >
          <RIIo.ImExit />
        </FTButton>
      )}
      {isMutable && (
        <FTButton
          onClick={() =>
            props.onMuteClick ? props.onMuteClick(props.member) : null
          }
        >
          <RIBS.BsMicMute />
        </FTButton>
      )}
    </div>
  );
};

const ChatRoomMessagesList = (props: { messages: TD.ChatRoomMessage[] }) => {
  return (
    <>
      {props.messages.map((data: TD.ChatRoomMessage) => (
        <ChatRoomMessageCard key={data.id} message={data} />
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
  return (
    <div className="flex h-full flex-row border-2 border-solid border-white p-2">
      <div className="flex h-full shrink grow flex-col overflow-hidden">
        {/* 今フォーカスしているルームのメッセージ */}
        <div className="shrink grow overflow-scroll border-2 border-solid border-white">
          <ChatRoomMessagesList messages={props.room_messages(props.room.id)} />
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
          members={props.room_members(props.room.id) || {}}
          {...props.memberOperations}
        />
      </div>
    </div>
  );
};
