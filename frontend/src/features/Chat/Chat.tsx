import { useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import * as TD from '@/typedef';
import * as Utils from '@/utils';
import { FTH3 } from '@/components/FTBasicComponents';
import { ChatRoomView } from './RoomView';
import { useAction } from '@/hooks';
import { OpenCard } from '@/components/CommandCard';
import { useAtom } from 'jotai';
import { authAtom } from '@/stores/auth';
import { ChatRoomListView } from './RoomList';
import { dataAtom, structureAtom } from '@/stores/structure';
import { Listbox } from '@headlessui/react';
import { InlineIcon } from '@/hocs/InlineIcon';
import { Icons } from '@/icons';

function makeCommand(mySocket: ReturnType<typeof io>, focusedRoomId: number) {
  return {
    open: (args: TD.OpenArgument) => {
      const data = {
        ...args,
      };
      console.log(data);
      mySocket?.emit('ft_open', data);
    },

    join: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(data);
      mySocket?.emit('ft_join', data);
    },

    leave: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(data);
      mySocket?.emit('ft_leave', data);
    },

    say: (content: string) => {
      if (!focusedRoomId) {
        return;
      }
      const data = {
        roomId: focusedRoomId,
        content,
      };
      console.log(data);
      mySocket?.emit('ft_say', data);
    },

    get_room_messages: (roomId: number) => {
      const data = {
        roomId,
        take: 50,
      };
      console.log(['get_room_messages'], data);
      mySocket?.emit('ft_get_room_messages', data);
    },

    get_room_members: (roomId: number) => {
      const data = {
        roomId,
      };
      console.log(['get_room_members'], data);
      mySocket?.emit('ft_get_room_members', data);
    },

    nomminate: (member: TD.ChatUserRelation) => {
      console.log('[nomminate]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_nomminate', data);
    },

    ban: (member: TD.ChatUserRelation) => {
      console.log('[ban]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_ban', data);
    },

    kick: (member: TD.ChatUserRelation) => {
      console.log('[kick]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_kick', data);
    },

    mute: (member: TD.ChatUserRelation) => {
      console.log('[mute]', member);
      const data = {
        roomId: member.chatRoomId,
        userId: member.userId,
      };
      mySocket?.emit('ft_mute', data);
    },
  };
}

const RoomFilterOptions = ['VISIBLE', 'JOINED', 'YOURS'] as const;
type RoomFilterOption = typeof RoomFilterOptions[number];
const RoomFilterOptionIcon = {
  VISIBLE: Icons.Chat.Visible,
  JOINED: Icons.Chat.Joined,
  YOURS: Icons.Chat.Yours,
};

const ChatRoomFilter = (props: {
  selected: RoomFilterOption;
  setSelected: (next: RoomFilterOption) => void;
}) => {
  const filterOptions = RoomFilterOptions.map((t) => ({
    option: t,
    icon: RoomFilterOptionIcon[t],
  }));
  const SelectedType = filterOptions.find(
    (rt) => rt.option === props.selected
  )!;
  return (
    <>
      <Listbox
        value={SelectedType}
        onChange={(next: { option: RoomFilterOption; icon: any }) =>
          props.setSelected(next.option)
        }
      >
        <Listbox.Button>
          Showing
          <InlineIcon i={<SelectedType.icon />} />
          {SelectedType.option}
        </Listbox.Button>
        <Listbox.Options className="bg-black">
          {filterOptions.map((Item) => {
            return (
              <Listbox.Option
                className="cursor-pointer p-[2px] text-center hover:bg-teal-800"
                key={Item.option}
                value={Item}
              >
                <InlineIcon i={<Item.icon />} />
                {Item.option}
              </Listbox.Option>
            );
          })}
        </Listbox.Options>
      </Listbox>
    </>
  );
};

/**
 * @returns チャットインターフェースコンポーネント
 */
export const Chat = (props: { mySocket: ReturnType<typeof io> }) => {
  const { mySocket } = props;

  const [personalData] = useAtom(authAtom.personalData);
  const [visibleRooms] = useAtom(dataAtom.visibleRoomsAtom);
  const [joiningRooms] = useAtom(dataAtom.joiningRoomsAtom);
  const [messagesInRoom] = useAtom(dataAtom.messagesInRoomAtom);
  const [membersInRoom] = useAtom(dataAtom.membersInRoomAtom);
  const [focusedRoomId, setFocusedRoomId] = useAtom(
    structureAtom.focusedRoomIdAtom
  );
  const userId = personalData ? personalData.id : -1;
  const [selected, setSelected] = useState<RoomFilterOption>(
    RoomFilterOptions[0]
  );

  const filteredRooms = (() => {
    switch (selected) {
      case 'VISIBLE':
        return visibleRooms;
      case 'YOURS':
        return visibleRooms.filter((r) => r.ownerId === personalData?.id);
      case 'JOINED':
        return visibleRooms.filter(
          (r) => !!joiningRooms.find((rr) => rr.id === r.id)
        );
    }
  })();

  // TODO: ユーザ情報は勝手に更新されうるので, id -> User のマップがどっかにあると良さそう。そこまで気を使うかはおいといて。

  /**
   * チャットコマンド
   */
  const command = makeCommand(mySocket, focusedRoomId);
  const memberOperations: TD.MemberOperations = {
    onNomminateClick: command.nomminate,
    onBanClick: command.ban,
    onKickClick: command.kick,
    onMuteClick: command.mute,
  };

  /**
   * わざわざ分けなくてもいいかな
   */
  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRooms.find((r) => r.id === roomId),
    isFocusingTo: (roomId: number) => focusedRoomId === roomId,
    isFocusingToSomeRoom: () => focusedRoomId > 0,
  };

  /**
   * 算出プロパティ的なの
   */
  const computed = {
    messages: useMemo(() => {
      const ms = messagesInRoom[focusedRoomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    }, [messagesInRoom, focusedRoomId]),

    focusedRoom: useMemo(
      () => visibleRooms.find((r) => r.id === focusedRoomId),
      [visibleRooms, focusedRoomId]
    ),

    you: useMemo(() => {
      if (!userId) {
        return null;
      }
      if (!focusedRoomId) {
        return null;
      }
      const us = membersInRoom[focusedRoomId];
      if (!us) {
        return null;
      }
      return us[userId];
    }, [userId, focusedRoomId, membersInRoom]),
  };

  /**
   * 保持しているデータに対する参照
   */
  const store = {
    count_message: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms) {
        return undefined;
      }
      return ms.length;
    },
    room_messages: (roomId: number) => {
      const ms = messagesInRoom[roomId];
      if (!ms || ms.length === 0) {
        return [];
      }
      return ms;
    },
    room_members: (roomId: number) => {
      const ms = membersInRoom[roomId];
      if (!ms) {
        return null;
      }
      return ms;
    },
  };

  const action = {
    /**
     * 実態はステート更新関数.
     * レンダリング後に副作用フックでコマンドが走る.
     */
    get_room_message: useAction(0, (roomId) => {
      if (roomId > 0) {
        if (!Utils.isfinite(store.count_message(roomId))) {
          command.get_room_messages(roomId);
        }
      }
    })[0],

    get_room_members: useAction(0, (roomId) => {
      if (roomId > 0) {
        const mems = store.room_members(roomId);
        if (!mems) {
          command.get_room_members(roomId);
        }
      }
    })[0],
  };

  return (
    <div
      className="flex w-full flex-row border-2 border-solid border-white p-2"
      style={{ height: '50em' }}
    >
      <div className="flex shrink-0 grow-0 flex-col">
        {/* 見えているチャットルーム */}
        <div className="flex shrink grow flex-col border-2 border-solid border-white">
          <FTH3 className="shrink-0 grow-0">ChatRooms</FTH3>
          <div className="shrink-0 grow-0 p-2 text-center">
            <ChatRoomFilter
              selected={selected}
              setSelected={(next) => setSelected(next)}
            />
          </div>
          <div className="flex shrink grow flex-col p-2">
            <ChatRoomListView
              rooms={filteredRooms}
              isJoiningTo={predicate.isJoiningTo}
              isFocusingTo={predicate.isFocusingTo}
              countMessages={store.count_message}
              onJoin={command.join}
              onLeave={command.leave}
              onFocus={(roomId: number) => {
                if (predicate.isJoiningTo(roomId)) {
                  setFocusedRoomId(roomId);
                  action.get_room_message(roomId);
                  action.get_room_members(roomId);
                }
              }}
            />
          </div>
        </div>
        <div className="border-2 border-solid border-white">
          <OpenCard sender={command.open} />
        </div>
      </div>

      <div className="flex shrink grow flex-col">
        {/* 今フォーカスしているルーム */}
        {!!computed.focusedRoom && (
          <ChatRoomView
            room={computed.focusedRoom}
            memberOperations={memberOperations}
            you={computed.you}
            say={command.say}
            room_messages={store.room_messages}
            room_members={store.room_members}
          />
        )}
      </div>
    </div>
  );
};
