import { useAtom } from 'jotai';
import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import { ChatMatchingMessageCard } from '@/components/ChatMatchingMessageCard';
import { ChatMemberCard } from '@/components/ChatMemberCard';
import { ChatMessageCard } from '@/components/ChatMessageCard';
import { ChatSystemMessageCard } from '@/components/ChatSystemMessageCard';
import { SayCard } from '@/components/CommandCard';
import {
  FTBarButton,
  FTBlockedHeader,
  FTButton,
  FTH3,
} from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { PrivateMatchCard } from '@/features/Pong/components/PrivateMatchCard';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useVerticalScrollAttr } from '@/hooks/useVerticalScrollAttr';
import { Icons, RoomTypeIcon } from '@/icons';
import { authAtom, chatSocketAtom, UserPersonalData } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import * as Utils from '@/utils';

import { makeCommand } from '../command';
import { ChatRoomUpdateCard } from '../RoomSetting';
import { InvitePrivateButton } from './InvitePrivateButton';

function messageCardId(message: TD.ChatRoomMessage) {
  return `message-${message.id}`;
}

const MessagesList = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  messages: TD.ChatRoomMessage[];
  members: TD.UserRelationMap;
}) => {
  const listId = useId();
  const scrollData = useVerticalScrollAttr(listId);
  const [prevLatestMessage, setPrevLatestMessage] =
    useState<TD.ChatRoomMessage | null>(null);

  useEffect(() => {
    const n = props.messages.length;
    const lm = n > 0 && props.messages[n - 1];
    if (!lm) {
      return;
    }
    setPrevLatestMessage(lm);
    const listEl = document.getElementById(listId);
    if (!listEl) {
      return;
    }
    if (!prevLatestMessage) {
      // [初期表示]
      // → 最新メッセージが表示されるよう瞬間的にスクロール
      const lastId = messageCardId(lm);
      const lastEl = document.getElementById(lastId);
      lastEl?.scrollIntoView({ behavior: 'auto' });
      return;
    }
    if (prevLatestMessage.createdAt < lm.createdAt) {
      // [メッセージ新着]
      // → 最新メッセージが表示されるよう自動スクロール
      if (n < 2) {
        return;
      }
      const [prevEl, nextEl] = ([n - 2, n - 1] as const).map((i) => {
        const lastMessage = props.messages[i];
        const lastId = messageCardId(lastMessage);
        return document.getElementById(lastId);
      });
      if (!prevEl || !nextEl) {
        return;
      }
      // (お気持ち: nextEl がリストビューの下辺にクロスしているか画面外すぐそこにいる場合だけスクロール)
      //  - prevEl が見えている
      //  - prevEl のボトムがリストビューの下辺以下にいる
      // を満たすなら nextEl が見えるようにスクロール
      const listRect = listEl.getBoundingClientRect();
      const prevRect = prevEl.getBoundingClientRect();
      const prevIsShown = !(
        prevRect.bottom < listRect.top || listRect.bottom < prevRect.top
      );
      const prevIsCrossingBottom =
        Math.floor(listRect.bottom) <= Math.ceil(prevRect.bottom);
      if (prevIsShown && prevIsCrossingBottom) {
        nextEl.scrollIntoView({
          behavior: document.visibilityState === 'visible' ? 'smooth' : 'auto',
        });
      }
      return;
    }
    // [メッセージ変化]
    // → 今見えている要素の「見かけの縦位置」を維持する
    listEl.scrollTop = scrollData.top - scrollData.height + listEl.scrollHeight;
    // 以下の関係式が成り立つようにする:
    // listEl.scrollHeight - listEl.scrollTop = scrollData.height - scrollData.top
    // ※お気持ち
    // height(領域の高さ) - top(領域の上から測った位置) は「領域の下から測った位置」となるので,
    // これが維持されるように listEl.scrollTop をいじって辻褄を合わせている.
  }, [props.messages, listId]);

  const [mySocket] = useAtom(chatSocketAtom);
  const [requestKey, setRequestKey] = useState('');
  useEffect(() => {
    if (Math.floor(scrollData.top) > 0) {
      return;
    }
    if (!mySocket) {
      return;
    }
    const oldestMessage = Utils.first(props.messages);
    const { get_room_messages } = makeCommand(mySocket, props.room.id);
    const rk = `${oldestMessage?.id}`;
    if (rk === requestKey) {
      return;
    }
    setRequestKey(rk);
    get_room_messages(props.room.id, 50, oldestMessage?.id);
  }, [mySocket, scrollData, props.room.id]);

  const componentForMessage = (data: TD.ChatRoomMessage) => {
    if (data.messageType === 'PR_STATUS') {
      return ChatMatchingMessageCard;
    }
    if (data.messageType) {
      return ChatSystemMessageCard;
    }
    return ChatMessageCard;
  };
  return (
    <div id={listId} className="h-full overflow-scroll">
      {props.messages.map((data: TD.ChatRoomMessage) => {
        const member = props.members[data.userId];
        const Component = componentForMessage(data);
        return (
          <Component
            key={data.id}
            id={messageCardId(data)}
            message={data}
            you={props.you}
            room={props.room}
            userId={data.userId}
            member={member}
            members={props.members}
          />
        );
      })}
    </div>
  );
};

const MembersList = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  members: TD.UserRelationMap;
}) => {
  const isPrivate = props.room.roomType === 'PRIVATE';
  const isOwner = props.room.ownerId === props.you?.userId;

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
    <div className="flex h-full flex-col bg-white">
      <FTH3 className="shrink-0 grow-0 bg-white">Members</FTH3>
      {isPrivate && isOwner && <InvitePrivateButton room={props.room} />}
      <div className="shrink grow bg-black">
        {computed.members.map((member) => (
          <div key={member.userId}>
            <ChatMemberCard member={member} {...Utils.omit(props, 'members')} />
          </div>
        ))}
      </div>
    </div>
  );
};

type ActualProp = {
  domain: 'chat' | 'dm';
  room: TD.ChatRoom;
  roomName: string;
  mySocket: ReturnType<typeof io>;
  personalData: UserPersonalData;
};

const ActualView = ({
  domain,
  room,
  roomName,
  mySocket,
  personalData,
}: ActualProp) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => setIsOpen(false);
  const [modalType, setModalType] = useState<'setting' | 'privateMatch' | null>(
    null
  );
  const navigate = useNavigate();
  const [members] = dataAtom.useMembersInRoom(room.id);
  const [messagesInRoom] = useAtom(dataAtom.messagesInRoomAtom);
  const computed = {
    you: useMemo(() => {
      const us = members;
      if (!us) {
        return null;
      }
      return us[personalData.id];
    }, [members, personalData.id]),
  };
  const store = {
    roomMessages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
  };
  const command = makeCommand(mySocket, room.id);
  if (!computed.you || !members) {
    return null;
  }
  const isOwner = room.ownerId === computed.you?.userId;
  const TypeIcon = RoomTypeIcon[room.roomType];
  const barButtons = domain === 'chat' && (
    <>
      {isOwner && (
        <FTButton
          onClick={() => {
            setModalType('setting');
            setIsOpen(true);
          }}
          className="shrink-0 grow-0"
        >
          <Icons.Setting className="block" />
        </FTButton>
      )}
      <FTBarButton
        onClick={() => {
          // command.pong_private_match_create(room.id)
          setModalType('privateMatch');
          setIsOpen(true);
        }}
      >
        <InlineIcon className="p-0" i={<Icons.Pong.Game className="block" />} />
        プライベートマッチ
      </FTBarButton>
      <FTBarButton
        onClick={() => {
          command.leave(room.id);
          navigate('/chat');
        }}
        className="shrink-0 grow-0"
      >
        Leave
      </FTBarButton>
    </>
  );
  const modalContent = (() => {
    switch (modalType) {
      case 'setting':
        return (
          <ChatRoomUpdateCard
            key={room.id}
            room={room}
            onSucceeded={closeModal}
            onCancel={closeModal}
          />
        );
      case 'privateMatch':
        return (
          <PrivateMatchCard
            room={room}
            onSucceeded={closeModal}
            onCancel={closeModal}
          />
        );
    }
    return null;
  })();
  return (
    <>
      {domain === 'chat' && (
        <Modal closeModal={closeModal} isOpen={isOpen}>
          {modalContent}
        </Modal>
      )}

      <div className="flex h-full flex-row border-2 border-solid border-white p-2">
        <div className="flex h-full shrink grow flex-col overflow-hidden">
          {/* タイトルバー */}
          <FTBlockedHeader className="text-xl">
            <FTButton
              onClick={() => navigate(`/${domain}`)}
              className="shrink-0 grow-0"
            >
              <Icons.Cancel className="block" />
            </FTButton>

            <InlineIcon i={<TypeIcon />} />
            <div className="shrink-0 grow-0">{roomName}</div>

            <div className="shrink grow"></div>
            {barButtons}
          </FTBlockedHeader>
          {/* 今フォーカスしているルームのメッセージ */}
          <div className="shrink grow overflow-hidden border-2 border-solid border-white">
            <MessagesList
              you={computed.you}
              room={room}
              members={members}
              messages={store.roomMessages(room.id)}
            />
          </div>
          <div className="shrink-0 grow-0 border-[2px] border-t-0 border-solid border-white p-2">
            {/* 今フォーカスしているルームへの発言 */}
            <div className="flex flex-row p-2">
              <SayCard sender={command.say} />
            </div>
          </div>
        </div>
        {domain === 'chat' && (
          <div className="ml-2 shrink-0 grow-0 basis-[16em] border-[2px] border-solid border-white bg-white">
            <MembersList you={computed.you} room={room} members={members} />
          </div>
        )}
      </div>
    </>
  );
};

type Prop =
  | { domain: 'chat'; room?: TD.ChatRoom }
  | { domain: 'dm'; room?: TD.DmRoom };
export const RoomView = ({ room, domain }: Prop) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const [members] = dataAtom.useMembersInRoom(room?.id || -1);
  const membersExists = !!members;
  useEffect(() => {
    if (!room || !mySocket || !personalData || membersExists) {
      return;
    }
    const command = makeCommand(mySocket, room.id);
    command.get_room_members(room.id);
  }, [membersExists, mySocket, personalData, room]);
  if (!room || !mySocket || !personalData) {
    return null;
  }
  const roomName =
    domain === 'chat'
      ? room.roomName
      : room.roomMember.find((member) => member.userId !== personalData.id)
          ?.user.displayName || '';
  return (
    <ActualView
      {...{ room, roomName, domain }}
      mySocket={mySocket}
      personalData={personalData}
    />
  );
};
