import { useMemo } from 'react';
import * as TD from './typedef';
import * as Utils from '@/utils';
import { FTButton, FTH3 } from '../../components/FTBasicComponents';
import * as dayjs from 'dayjs';
import * as RIFa from 'react-icons/fa';
import * as RIIo from 'react-icons/im';
import * as RIBS from 'react-icons/bs';

/**
 * メッセージを表示するコンポーネント
 */
export const ChatRoomMessageCard = (props: { message: TD.ChatRoomMessage }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '2px',
        border: '1px solid useFetcher',
        marginBottom: '12px',
      }}
      key={props.message.id}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            margin: '1px',
            padding: '0 4px',
            color: 'black',
            backgroundColor: 'white',
          }}
        >
          {props.message.user.displayName}
        </div>
        <div style={{ paddingRight: '4px' }}>
          {dayjs(props.message.createdAt).format('MM/DD HH:mm:ss')}
        </div>
        <div style={{ paddingRight: '4px' }}>
          chatRoomId: {props.message.chatRoomId}
        </div>
      </div>
      <div>{props.message.content}</div>
    </div>
  );
};

export const ChatRoomMemberCard = (
  props: {
    you: TD.ChatUserRelation | null;
    room: TD.ChatRoom;
    member: TD.ChatUserRelation;
    onClick?: (r: TD.ChatUserRelation) => void;
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
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <div
        className="room-member-element cursor-pointer hover:bg-teal-700"
        key={props.member.userId}
        style={{
          flexGrow: 1,
          flexShrink: 1,
          ...(isYou ? { fontWeight: 'bold' } : {}),
        }}
        onClick={() => (props.onClick ? props.onClick(props.member) : null)}
      >
        {userTypeCap()}
        {props.member.user.displayName}
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

export const ChatRoomMembersList = (
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
    <div
      className="room-members"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <FTH3
        style={{
          flexGrow: 0,
          flexShrink: 0,
        }}
      >
        Members
      </FTH3>
      <div
        style={{
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
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
