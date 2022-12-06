import { useAtom } from 'jotai';
import { useEffect, useId, useMemo, useState } from 'react';

import { ChatMemberCard } from '@/components/ChatMemberCard';
import { ChatMessageCard } from '@/components/ChatMessageCard';
import { ChatSystemMessageCard } from '@/components/ChatSystemMessageCard';
import { SayCard } from '@/components/CommandCard';
import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { Modal } from '@/components/Modal';
import { InlineIcon } from '@/hocs/InlineIcon';
import { useVerticalScrollAttr } from '@/hooks/useVerticalScrollAttr';
import { Icons } from '@/icons';
import { chatSocketAtom } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';
import * as Utils from '@/utils';

import { makeCommand } from './command';
import { ChatRoomUpdateCard, RoomTypeIcon } from './RoomSetting';

function messageCardId(message: TD.ChatRoomMessage) {
  return `message-${message.id}`;
}

const MessagesList = (props: {
  you: TD.ChatUserRelation | null;
  room: TD.ChatRoom;
  messages: TD.ChatRoomMessage[];
  members: TD.UserRelationMap;
  memberOperations: TD.MemberOperations;
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

  return (
    <div id={listId} className="h-full overflow-scroll">
      {props.messages.map((data: TD.ChatRoomMessage) => {
        const member = props.members[data.userId];
        if (data.messageType) {
          return (
            <ChatSystemMessageCard
              key={data.id}
              id={messageCardId(data)}
              message={data}
              you={props.you}
              room={props.room}
              userId={data.userId}
              member={member}
              members={props.members}
              memberOperations={props.memberOperations}
            />
          );
        }
        return (
          <ChatMessageCard
            key={data.id}
            id={messageCardId(data)}
            message={data}
            you={props.you}
            room={props.room}
            userId={data.userId}
            member={member}
            memberOperations={props.memberOperations}
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
  memberOperations: TD.MemberOperations;
}) => {
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
  const [mySocket] = useAtom(chatSocketAtom);
  if (!mySocket) {
    return null;
  }
  const command = makeCommand(mySocket, props.room.id);

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
        <ChatRoomUpdateCard
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

            <FTButton
              onClick={() => command.pong_private_match_create(props.room.id)}
            >
              プライベートマッチ
            </FTButton>
          </FTH3>
          {/* 今フォーカスしているルームのメッセージ */}
          <div className="shrink grow overflow-hidden border-2 border-solid border-white">
            <MessagesList
              you={props.you}
              room={props.room}
              members={members}
              messages={props.roomMessages(props.room.id)}
              memberOperations={props.memberOperations}
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
            memberOperations={props.memberOperations}
          />
        </div>
      </div>
    </>
  );
};
