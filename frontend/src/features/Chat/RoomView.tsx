import { useMemo, useState } from 'react';
import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { SayCard } from '@/components/CommandCard';
import { Icons } from '@/icons';
import { Modal } from '@/components/Modal';
import { ChatRoomSettingCard, RoomTypeIcon } from './RoomSetting';
import { InlineIcon } from '@/hocs/InlineIcon';
import { dataAtom } from '@/stores/structure';
import { ChatMessageCard } from '@/components/ChatMessageCard';
import { ChatMemberCard } from '@/components/ChatMemberCard';

const MessagesList = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  messages: TD.ChatRoomMessage[];
  members: TD.UserRelationMap;
}) => {
  return (
    <>
      {props.messages.map((data: TD.ChatRoomMessage) => {
        const member = props.members[data.userId];
        return (
          member && (
            <ChatMessageCard
              key={data.id}
              message={data}
              you={props.you}
              room={props.room}
              member={member}
            />
          )
        );
      })}
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
            <ChatMemberCard member={member} {...Utils.omit(props, 'members')} />
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
            {isOwner && (
              <FTButton onClick={openModal}>
                <Icons.Setting className="inline" />
              </FTButton>
            )}
          </FTH3>
          {/* 今フォーカスしているルームのメッセージ */}
          <div className="shrink grow overflow-scroll border-2 border-solid border-white">
            <MessagesList
              you={props.you}
              room={props.room}
              members={members}
              messages={props.roomMessages(props.room.id)}
            />
          </div>
          <div className="shrink-0 grow-0 border-2 border-solid border-white p-2">
            {/* 今フォーカスしているルームへの発言 */}
            <div className="flex flex-row border-2 border-solid border-white p-2">
              <SayCard sender={props.say} />
            </div>
          </div>
        </div>
        <div className="shrink-0 grow-0 basis-[12em]">
          <MembersList
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
