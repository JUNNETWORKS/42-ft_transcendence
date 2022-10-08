import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import * as TD from './typedef';
import * as Utils from '@/utils';

const socket = io('http://localhost:3000/chat', {
  auth: (cb) => {
    cb({
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Inlva2F3YWRhQHN0dWRlbnQuNDJ0b2t5by5qcCIsInN1YiI6NSwiaWF0IjoxNjY1MDUzMTQ5LjYyNiwiZXhwIjoxNjY3NjQ1MTQ5LCJhdWQiOiJ0cmExMDAwIiwiaXNzIjoidHJhMTAwMCJ9.CQ7QIQWSEm9lNV4iHwq0-7doJG_ZVXLhzqPfbBIE49g',
    });
  },
});

/**
 * `id`の変化をトリガーとして何らかのアクションを行うフック
 * @param initialId `id`の初期値
 * @param action  `id`を受け取り, アクションを実行する関数
 */
function useAction<T>(initialId: T, action: (id: T) => void) {
  const [actionId, setActionId] = useState<T>(initialId);
  useEffect(() => action(actionId), [action, actionId]);
  return [setActionId];
}

type UserRelationMap = {
  [userId: number]: TD.ChatUserRelation;
};

/**
 * メッセージを表示するコンポーネント
 */
const ChatRoomMessageCard = (props: { message: TD.ChatRoomMessage }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '2px',
        border: '1px solid gray',
      }}
      key={props.message.id}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div style={{ paddingRight: '4px' }}>
          displayName: {props.message.user.displayName}
        </div>
        <div style={{ paddingRight: '4px' }}>
          chatRoomId: {props.message.chatRoomId}
        </div>
        <div style={{ paddingRight: '4px' }}>
          createdAt: {props.message.createdAt.toISOString()}
        </div>
      </div>
      <div>{props.message.content}</div>
    </div>
  );
};

const ChatRoomMembersList = (props: {
  userId: number;
  members: UserRelationMap;
}) => {
  const computed = {
    members: useMemo(() => {
      const mems: TD.ChatUserRelation[] = [];
      const you = props.members[props.userId];
      if (you) {
        mems.push(you);
      }
      Utils.keys(props.members).forEach((id) => {
        const m = props.members[id];
        if (props.userId === m.userId) {
          return;
        }
        mems.push(m);
      });
      return mems;
    }, [props.userId, props.members]),
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
      <h4
        style={{
          flexGrow: 0,
          flexShrink: 0,
        }}
      >
        Members
      </h4>
      <div
        style={{
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        {computed.members.map((member) => {
          return (
            <div className="room-member-element" key={member.userId}>
              {member.user.displayName}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 発言を編集し, sendボタン押下で外部(props.sender)に送出するコンポーネント
 */
const SayCard = (props: { sender: (content: TD.SayArgument) => void }) => {
  const [content, setContent] = useState('');
  const sender = () => {
    // クライアント側バリデーション
    if (!content.trim()) {
      return;
    }
    props.sender(content);
    setContent('');
  };
  const computed = {
    isSendable: () => {
      if (!content.trim()) {
        return false;
      }
      return true;
    },
  };

  return (
    <div
      className="content"
      style={{
        padding: '2px',
        border: '1px solid gray',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <div
        style={{
          flexGrow: 0,
          flexShrink: 0,
          padding: '2px',
        }}
      >
        <button disabled={!computed.isSendable()} onClick={sender}>
          Send
        </button>
      </div>
      <div
        style={{
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <input
          id="input"
          autoComplete="off"
          value={content}
          placeholder="発言内容"
          onChange={(e) => setContent(e.target.value)}
          style={{
            display: 'block',
            height: '100%',
            width: '100%',
            padding: '0',
          }}
        />
      </div>
    </div>
  );
};

/**
 * 新しく作成するチャットルームの情報を編集し, 外部に送出するコンポーネント
 * @param props
 * @returns
 */
const OpenCard = (props: { sender: (argument: TD.OpenArgument) => void }) => {
  const [roomName, setRoomName] = useState('');
  const sender = () => {
    // クライアント側バリデーション
    if (!roomName.trim()) {
      return;
    }
    props.sender({
      roomName,
      roomType: 'PUBLIC',
    });
    setRoomName('');
  };
  return (
    <div
      className="new-room"
      style={{
        padding: '2px',
        border: '1px solid gray',
        flexGrow: 0,
        flexShrink: 0,
      }}
    >
      <h4>Open</h4>
      <input
        id="input"
        autoComplete="off"
        placeholder="チャットルーム名"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <button onClick={() => sender()}>Open</button>
    </div>
  );
};

/**
 *
 * @returns チャットインターフェースコンポーネント
 */
export const Chat = () => {
  type ChatRoomMessage = TD.ChatRoomMessage;
  const [userId, setUserId] = useState(-1);
  // 見えているチャットルームの一覧
  const [visibleRoomList, setVisibleRoomList] = useState<TD.ChatRoom[]>([]);
  // join しているチャットルームの一覧
  const [joiningRoomList, setJoiningRoomList] = useState<TD.ChatRoom[]>([]);
  // 今フォーカスしているチャットルームのID
  const [focusedRoomId, setFocusedRoomId] = useState(-1);

  /**
   * チャットルーム内のメッセージのリスト
   * TODO: もっとマシな方法ないの
   */
  const [messagesInRoom, setMessagesInRoom] = useState<{
    [roomId: number]: ChatRoomMessage[];
  }>({});
  /**
   * チャットルーム内のメンバーのマップ
   */
  const [membersInRoom, setMembersInRoom] = useState<{
    [roomId: number]: UserRelationMap;
  }>({});
  // TODO: ユーザ情報は勝手に更新されうるので, id -> User のマップがどっかにあると良さそう。そこまで気を使うかはおいといて。

  useEffect(() => {
    socket.on('ft_connection', (data: TD.ConnectionResult) => {
      console.log('catch connection');
      setUserId(data.userId);
      setJoiningRoomList(data.joiningRooms);
      setVisibleRoomList(data.visibleRooms);
    });

    socket.on('ft_open', (data: TD.OpenResult) => {
      console.log('catch open');
      console.log(data);
      const room: TD.ChatRoom = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setVisibleRoomList((prev) => {
        const next = [...prev];
        next.push(room);
        return next;
      });
      if (room.ownerId === userId) {
        setJoiningRoomList((prev) => {
          const next = [...prev];
          next.push(room);
          return next;
        });
      }
    });

    socket.on('ft_say', (data: TD.SayResult) => {
      const message = TD.Mapper.chatRoomMessage(data);
      console.log('catch say');
      const roomId = data.chatRoomId;
      stateMutater.addMessagesToRoom(roomId, [message]);
    });

    socket.on('ft_join', (data: TD.JoinResult) => {
      console.log('catch join');
      setJoiningRoomList((prev) => {
        const { room } = data;
        const sameRoom = prev.find((r) => r.id === room.id);
        if (sameRoom) {
          return prev;
        }
        const newRoomList = [...prev];
        newRoomList.push(room);
        return newRoomList;
      });
    });

    socket.on('ft_leave', (data: TD.LeaveResult) => {
      console.log('catch leave');
      setJoiningRoomList((prev) => {
        const { room } = data;
        console.log(predicate.isFocusingTo(room.id), focusedRoomId, room.id);
        stateMutater.unfocusRoom(room.id);
        const newRoomList = prev.filter((r) => r.id !== room.id);
        if (newRoomList.length === prev.length) {
          return prev;
        }
        return newRoomList;
      });
    });

    socket.on('ft_get_room_messages', (data: TD.GetRoomMessagesResult) => {
      console.log('catch get_room_messages');
      const { id, messages } = data;
      console.log(id, !!messages);
      stateMutater.addMessagesToRoom(
        id,
        messages.map(TD.Mapper.chatRoomMessage)
      );
    });

    socket.on('ft_get_room_members', (data: TD.GetRoomMembersResult) => {
      console.log('catch get_room_members');
      const { id, members } = data;
      console.log(id, members);
      stateMutater.addMembersInRoom(
        id,
        Utils.keyBy(members, (a) => `${a.userId}`)
      );
    });

    return () => {
      socket.off('ft_connection');
      socket.off('ft_open');
      socket.off('ft_say');
      socket.off('ft_join');
      socket.off('ft_leave');
      socket.off('ft_get_room_messages');
      socket.off('ft_get_room_members');
    };
  });

  /**
   * チャットコマンド
   */
  const command = {
    open: (args: TD.OpenArgument) => {
      const data = {
        ...args,
        callerId: 1,
      };
      console.log(data);
      socket.emit('ft_open', data);
    },

    join: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
      };
      console.log(data);
      socket.emit('ft_join', data);
    },

    leave: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
      };
      console.log(data);
      socket.emit('ft_leave', data);
    },

    say: (content: string) => {
      if (!focusedRoomId) {
        return;
      }
      const data = {
        roomId: focusedRoomId,
        callerId: 1,
        content,
      };
      console.log(data);
      socket.emit('ft_say', data);
    },

    get_room_messages: (roomId: number) => {
      const data = {
        roomId,
        take: 50,
        callerId: 1,
      };
      console.log(['get_room_messages'], data);
      socket.emit('ft_get_room_messages', data);
    },

    get_room_members: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
      };
      console.log(['get_room_members'], data);
      socket.emit('ft_get_room_members', data);
    },
  };

  /**
   * ステート変更処理のラッパ
   */
  const stateMutater = {
    // 指定したルームにフォーカス(フロントエンドで中身を表示)する
    focusRoom: (roomId: number) => {
      setFocusedRoomId((prev) => {
        if (predicate.isFocusingTo(roomId)) {
          // すでにフォーカスしている
          console.log('[focusRoom] stay');
          return prev;
        }
        // メッセージがないなら取得する
        action.get_room_message(roomId);
        // メンバー情報がないなら取得する
        action.get_room_members(roomId);
        return roomId;
      });
    },

    // ルームへのフォーカスをやめる
    unfocusRoom: (roomId: number) =>
      setFocusedRoomId((prev) => {
        console.log('unfocusing..');
        if (prev === roomId) {
          return -1;
        } else {
          return prev;
        }
      }),

    // チャットルームにメッセージを追加する
    // (メッセージは投稿時刻の昇順になる)
    addMessagesToRoom: (roomId: number, newMessages: TD.ChatRoomMessage[]) => {
      setMessagesInRoom((prev) => {
        const next: { [roomId: number]: ChatRoomMessage[] } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = [...prev[key]];
        });
        if (!next[roomId]) {
          next[roomId] = [];
        }
        const messages = next[roomId];
        messages.push(...newMessages);
        next[roomId] = Utils.sortBy(
          Utils.uniqBy(messages, (m) => m.id),
          (m) => m.createdAt
        );
        return next;
      });
    },

    /**
     * チャットルームにメンバーをマージする
     * @param roomId
     * @param newMembers
     */
    addMembersInRoom: (roomId: number, newMembers: UserRelationMap) => {
      setMembersInRoom((prev) => {
        const next: { [roomId: number]: UserRelationMap } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = prev[key];
        });
        if (!next[roomId]) {
          next[roomId] = {};
        }
        const members = next[roomId];
        Utils.keys(newMembers).forEach((key) => {
          members[key] = newMembers[key];
        });
        return next;
      });
    },
  };

  /**
   * わざわざ分けなくてもいいかな
   */
  const predicate = {
    isJoiningTo: (roomId: number) =>
      !!joiningRoomList.find((r) => r.id === roomId),
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
      () => visibleRoomList.find((r) => r.id === focusedRoomId),
      [visibleRoomList, focusedRoomId]
    ),
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
      style={{
        height: '50em',
        padding: '2px',
        border: '1px solid gray',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <div
        className="vertical left"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 見えているチャットルーム */}
        <div
          className="room-list"
          style={{
            padding: '2px',
            border: '1px solid gray',
            flexGrow: 1,
            flexShrink: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            ChatRooms {focusedRoomId}
          </h3>
          <div
            style={{
              padding: '2px',
              flexGrow: 1,
              flexShrink: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {visibleRoomList.map((data: TD.ChatRoom) => {
              return (
                /* クリックしたルームにフォーカスを当てる */
                <div
                  className="room-list-element"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '2px',
                    border: '1px solid gray',
                  }}
                  key={data.id}
                >
                  <div
                    className="joining-button"
                    style={{
                      flexGrow: 0,
                      flexBasis: 0,
                    }}
                  >
                    {predicate.isJoiningTo(data.id) ? (
                      <button
                        style={{ width: '4em' }}
                        onClick={() => command.leave(data.id)}
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        style={{ width: '4em' }}
                        onClick={() => command.join(data.id)}
                      >
                        Join
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      flexGrow: 1,
                      flexBasis: 1,
                      cursor: predicate.isJoiningTo(data.id)
                        ? 'pointer'
                        : 'unset',
                      fontWeight: predicate.isJoiningTo(data.id)
                        ? 'bold'
                        : 'normal',
                      backgroundColor: predicate.isFocusingTo(data.id)
                        ? 'lightgreen'
                        : 'unset',
                    }}
                    onClick={() => {
                      if (predicate.isJoiningTo(data.id)) {
                        stateMutater.focusRoom(data.id);
                      }
                    }}
                  >
                    {data.id} / {data.roomName}{' '}
                    {(() => {
                      const n = store.count_message(data.id);
                      return Utils.isfinite(n) && n > 0 ? `(${n})` : '';
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <OpenCard sender={command.open} />
      </div>

      <div
        className="vertical right"
        style={{
          flexGrow: 1,
          flexShrink: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 今フォーカスしているルーム */}
        {!!computed.focusedRoom && (
          <div
            className="room-main"
            style={{
              display: 'flex',
              flexDirection: 'row',
              border: '1px solid gray',
              padding: '2px',
              height: '100%',
            }}
          >
            <div
              className="room-left-pane"
              style={{
                flexGrow: 1,
                flexShrink: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {/* 今フォーカスしているルームのメッセージ */}
              <div
                className="room-message-list"
                style={{
                  padding: '2px',
                  border: '1px solid gray',
                  flexGrow: 1,
                  flexShrink: 1,
                  overflow: 'scroll',
                }}
              >
                {store
                  .room_messages(focusedRoomId)
                  .map((data: TD.ChatRoomMessage) => (
                    <ChatRoomMessageCard key={data.id} message={data} />
                  ))}
              </div>
              <div
                className="input-panel"
                style={{
                  padding: '2px',
                  border: '1px solid gray',
                  flexGrow: 0,
                  flexShrink: 0,
                }}
              >
                {/* 今フォーカスしているルームへの発言 */}
                <SayCard sender={command.say} />
              </div>
            </div>
            <div
              className="room-right-pane"
              style={{
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: '10em',
              }}
            >
              <ChatRoomMembersList
                userId={userId}
                members={store.room_members(focusedRoomId) || {}}
              />
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: '20em',
          overflow: 'scroll',
        }}
      >
        <div>
          <h4>visibleRoomList</h4>
          {JSON.stringify(visibleRoomList)}
        </div>
        <div>
          <h4>joiningRoomList</h4>
          {JSON.stringify(joiningRoomList)}
        </div>
      </div>
    </div>
  );
};
