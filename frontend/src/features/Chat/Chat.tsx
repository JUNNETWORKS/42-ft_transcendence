import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import * as TD from './typedef';
import * as Utils from '@/utils';
import { styleTextFieldCommon, styleButtonCommon } from './styles';
import { FTTextField, FTH3, FTH4 } from './FTBasicComponents';
import * as dayjs from 'dayjs';

/**
 * 通常の`useState`の返り値に加えて, stateを初期値に戻す関数`resetter`を返す.
 * @param initial
 * @returns
 */
function useStateWithResetter<T>(initial: T) {
  const [val, setter] = useState<T>(initial);
  const resetter = () => setter(initial);
  return [val, setter, resetter] as const;
}

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
      <FTH4
        style={{
          flexGrow: 0,
          flexShrink: 0,
        }}
      >
        Members
      </FTH4>
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
  const [content, setContent, resetContent] = useStateWithResetter('');
  const sender = () => {
    // クライアント側バリデーション
    if (!content.trim()) {
      return;
    }
    props.sender(content);
    resetContent();
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
    <>
      <div
        style={{
          flexGrow: 0,
          flexShrink: 0,
          padding: '2px',
        }}
      >
        <button
          disabled={!computed.isSendable()}
          onClick={sender}
          style={{ ...styleButtonCommon }}
        >
          Send
        </button>
      </div>
      <div
        style={{
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <FTTextField
          autoComplete="off"
          value={content}
          placeholder="発言内容"
          onChange={(e) => setContent(e.target.value)}
          style={{
            ...styleTextFieldCommon,
            display: 'block',
            height: '100%',
            width: '100%',
            padding: '0',
          }}
        />
      </div>
    </>
  );
};

/**
 * 新しく作成するチャットルームの情報を編集し, 外部に送出するコンポーネント
 * @param props
 * @returns
 */
const OpenCard = (props: { sender: (argument: TD.OpenArgument) => void }) => {
  const [roomName, setRoomName, resetRoomName] = useStateWithResetter('');
  const sender = () => {
    // クライアント側バリデーション
    if (!roomName.trim()) {
      return;
    }
    props.sender({
      roomName,
      roomType: 'PUBLIC',
    });
    resetRoomName();
  };

  return (
    <div className="open-card">
      <FTH4>Open</FTH4>
      <FTTextField
        autoComplete="off"
        placeholder="チャットルーム名"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        style={{
          ...styleTextFieldCommon,
        }}
      />
      <button onClick={() => sender()} style={{ ...styleButtonCommon }}>
        Open
      </button>
    </div>
  );
};

const SelfCard = (props: {
  currentUserIdStr: string;
  sender: (userIdStr: string) => void;
}) => {
  const [userIdStr, setUserIdStr] = useState('');
  return (
    <div className="self-card">
      <FTH4>Self</FTH4>
      Current userId: {props.currentUserIdStr || '(none)'}
      <br />
      <FTTextField
        autoComplete="off"
        placeholder="ユーザID"
        value={userIdStr}
        onChange={(e) => setUserIdStr(e.target.value)}
        style={{
          ...styleTextFieldCommon,
        }}
      />
      <button
        onClick={() => props.sender(userIdStr)}
        style={{ ...styleButtonCommon }}
      >
        Force Login
      </button>
    </div>
  );
};

/**
 *
 * @returns チャットインターフェースコンポーネント
 */
export const Chat = () => {
  type ChatRoomMessage = TD.ChatRoomMessage;
  const useSocket = () => {
    const [mySocket, setMySocket] = useState<ReturnType<typeof io> | null>(
      null
    );
    const [userIdStr, setUserIdStr] = useState('');
    const setter = (str: string) => {
      setUserIdStr((prev) => {
        if (prev === str.trim()) {
          return prev;
        }
        const next = str.trim();
        if (!next) {
          return prev;
        }
        const userId = parseInt(next);
        if (userId > 0) {
          setMySocket((prev) => {
            prev?.disconnect();
            // すべてのstateをリセット

            resetUserId();
            resetVisibleRooms();
            resetJoiningRooms();
            resetFocusedRoomId();
            resetMessagesInRoom();
            resetMembersInRoom();
            action.get_room_members(0);
            action.get_room_message(0);
            const socket = io('http://localhost:3000/chat', {
              auth: (cb) => {
                cb({
                  // 本当はアクセストークンをここに記載する
                  // token: "some_access_token"
                  // 開発中はここにuserIdを書いてもよい
                  sub: userId,
                });
              },
            });
            return socket;
          });
          return next;
        }
        return prev;
      });
    };
    return [userIdStr, setter, mySocket] as const;
  };
  const [userIdStr, setUserIdStr, mySocket] = useSocket();

  const [userId, setUserId, resetUserId] = useStateWithResetter(-1);
  // 見えているチャットルームの一覧
  const [visibleRooms, setVisibleRooms, resetVisibleRooms] =
    useStateWithResetter<TD.ChatRoom[]>([]);
  // join しているチャットルームの一覧
  const [joiningRooms, setJoiningRooms, resetJoiningRooms] =
    useStateWithResetter<TD.ChatRoom[]>([]);
  // 今フォーカスしているチャットルームのID
  const [focusedRoomId, setFocusedRoomId, resetFocusedRoomId] =
    useStateWithResetter(-1);

  /**
   * チャットルーム内のメッセージのリスト
   * TODO: もっとマシな方法ないの
   */
  const [messagesInRoom, setMessagesInRoom, resetMessagesInRoom] =
    useStateWithResetter<{
      [roomId: number]: ChatRoomMessage[];
    }>({});
  /**
   * チャットルーム内のメンバーのマップ
   */
  const [membersInRoom, setMembersInRoom, resetMembersInRoom] =
    useStateWithResetter<{
      [roomId: number]: UserRelationMap;
    }>({});
  // TODO: ユーザ情報は勝手に更新されうるので, id -> User のマップがどっかにあると良さそう。そこまで気を使うかはおいといて。

  useEffect(() => {
    mySocket?.on('ft_connection', (data: TD.ConnectionResult) => {
      console.log('catch connection');
      setUserId(data.userId);
      setJoiningRooms(data.joiningRooms);
      setVisibleRooms(data.visibleRooms);
    });

    mySocket?.on('ft_open', (data: TD.OpenResult) => {
      console.log('catch open');
      console.log(data);
      const room: TD.ChatRoom = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setVisibleRooms((prev) => {
        const next = [...prev];
        next.push(room);
        return next;
      });
      if (room.ownerId === userId) {
        setJoiningRooms((prev) => {
          const next = [...prev];
          next.push(room);
          return next;
        });
      }
    });

    mySocket?.on('ft_say', (data: TD.SayResult) => {
      const message = TD.Mapper.chatRoomMessage(data);
      console.log('catch say');
      const roomId = data.chatRoomId;
      stateMutater.addMessagesToRoom(roomId, [message]);
    });

    mySocket?.on('ft_join', (data: TD.JoinResult) => {
      console.log('catch join', data);
      if (userId > 0) {
        const { chatRoom: room } = data.relation;
        const user = data.user;
        console.log(room, user);
        if (user.id === userId) {
          // 自分に関する通知
          console.log('for self');
          setJoiningRooms((prev) => {
            const sameRoom = prev.find((r) => r.id === room.id);
            if (sameRoom) {
              return prev;
            }
            const newRoomList = [...prev];
            newRoomList.push(room);
            return newRoomList;
          });
        } else {
          // 他人に関する通知
          console.log('for other');
          stateMutater.addMembersInRoom(room.id, { [user.id]: data.relation });
        }
      }
    });

    mySocket?.on('ft_leave', (data: TD.LeaveResult) => {
      console.log('catch leave', data);
      if (userId > 0) {
        const { chatRoom: room } = data.relation;
        const user = data.user;
        console.log(room, user);
        if (user.id === userId) {
          // 自分に関する通知
          console.log('for self');
          setJoiningRooms((prev) => {
            console.log(
              predicate.isFocusingTo(room.id),
              focusedRoomId,
              room.id
            );
            stateMutater.unfocusRoom(room.id);
            const newRoomList = prev.filter((r) => r.id !== room.id);
            if (newRoomList.length === prev.length) {
              return prev;
            }
            return newRoomList;
          });
        } else {
          // 他人に関する通知
          console.log('for other');
          stateMutater.removeMembersInRoom(room.id, user.id);
        }
      }
    });

    mySocket?.on('ft_get_room_messages', (data: TD.GetRoomMessagesResult) => {
      console.log('catch get_room_messages');
      const { id, messages } = data;
      console.log(id, !!messages);
      stateMutater.addMessagesToRoom(
        id,
        messages.map(TD.Mapper.chatRoomMessage)
      );
    });

    mySocket?.on('ft_get_room_members', (data: TD.GetRoomMembersResult) => {
      console.log('catch get_room_members');
      const { id, members } = data;
      console.log(id, members);
      stateMutater.addMembersInRoom(
        id,
        Utils.keyBy(members, (a) => `${a.userId}`)
      );
    });

    return () => {
      mySocket?.removeAllListeners();
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
      mySocket?.emit('ft_open', data);
    },

    join: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
      };
      console.log(data);
      mySocket?.emit('ft_join', data);
    },

    leave: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
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
        callerId: 1,
        content,
      };
      console.log(data);
      mySocket?.emit('ft_say', data);
    },

    get_room_messages: (roomId: number) => {
      const data = {
        roomId,
        take: 50,
        callerId: 1,
      };
      console.log(['get_room_messages'], data);
      mySocket?.emit('ft_get_room_messages', data);
    },

    get_room_members: (roomId: number) => {
      const data = {
        roomId,
        callerId: 1,
      };
      console.log(['get_room_members'], data);
      mySocket?.emit('ft_get_room_members', data);
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
      console.log(`addMembersInRoom(${roomId}, ${newMembers})`);
      setMembersInRoom((prev) => {
        console.log(`addMembersInRoom -> setMembersInRoom`);
        const next: { [roomId: number]: UserRelationMap } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = prev[key] ? { ...prev[key] } : {};
        });
        if (!next[roomId]) {
          next[roomId] = {};
        }
        const members = next[roomId];
        Utils.keys(newMembers).forEach((key) => {
          members[key] = newMembers[key];
        });
        console.log(prev, next);
        return next;
      });
    },

    removeMembersInRoom: (roomId: number, userId: number) => {
      console.log(`removeMembersInRoom(${roomId}, ${userId})`);
      setMembersInRoom((prev) => {
        console.log(`removeMembersInRoom -> setMembersInRoom`);
        const next: { [roomId: number]: UserRelationMap } = {};
        Utils.keys(prev).forEach((key) => {
          next[key] = prev[key] ? { ...prev[key] } : {};
        });
        const members = next[roomId];
        if (!members) {
          return next;
        }
        console.log('removing member', userId, 'from', members);
        delete members[userId];
        console.log('members', members);
        console.log(prev, next);
        return next;
      });
    },
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
        border: '1px solid useFetcher',
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
            border: '1px solid white',
            flexGrow: 1,
            flexShrink: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FTH3
            style={{
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            ChatRooms {focusedRoomId}
          </FTH3>
          <div
            style={{
              padding: '2px',
              flexGrow: 1,
              flexShrink: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {visibleRooms.map((data: TD.ChatRoom) => {
              return (
                /* クリックしたルームにフォーカスを当てる */
                <div
                  className="room-list-element"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '2px',
                    border: '1px solid white',
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
                        style={{
                          ...styleButtonCommon,
                          width: '4em',
                          color: 'black',
                          backgroundColor: 'white',
                        }}
                        onClick={() => command.leave(data.id)}
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        style={{ ...styleButtonCommon, width: '4em' }}
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
                      padding: '4px',
                      cursor: predicate.isJoiningTo(data.id)
                        ? 'pointer'
                        : 'unset',
                      fontWeight: predicate.isJoiningTo(data.id)
                        ? 'bold'
                        : 'normal',
                      ...(predicate.isFocusingTo(data.id)
                        ? { borderLeft: '12px solid turquoise' }
                        : {}),
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
        <div
          style={{
            border: '1px solid white',
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <OpenCard sender={command.open} />
        </div>
        <div
          style={{
            border: '1px solid white',
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <SelfCard currentUserIdStr={userIdStr} sender={setUserIdStr} />
        </div>
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
              border: '1px solid white',
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
                  border: '1px solid white',
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
                  border: '1px solid white',
                  flexGrow: 0,
                  flexShrink: 0,
                }}
              >
                {/* 今フォーカスしているルームへの発言 */}
                <div
                  style={{
                    padding: '2px',
                    border: '1px solid white',
                    display: 'flex',
                    flexDirection: 'row',
                  }}
                >
                  <SayCard sender={command.say} />
                </div>
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
          <FTH4>visibleRoomList</FTH4>
          {JSON.stringify(visibleRooms)}
        </div>
        <div>
          <FTH4>joiningRoomList</FTH4>
          {JSON.stringify(joiningRooms)}
        </div>
      </div>
    </div>
  );
};
