import { useState } from 'react';
import * as TD from './typedef';
import { FTTextField, FTButton, FTH3, FTH4 } from './FTBasicComponents';
import { useStateWithResetter } from './hooks';

/**
 * 発言を編集し, sendボタン押下で外部(props.sender)に送出するコンポーネント
 */
export const SayCard = (props: {
  sender: (content: TD.SayArgument) => void;
}) => {
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
        <FTButton disabled={!computed.isSendable()} onClick={sender}>
          Send
        </FTButton>
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
export const OpenCard = (props: {
  sender: (argument: TD.OpenArgument) => void;
}) => {
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
      />
      <FTButton onClick={() => sender()}>Open</FTButton>
    </div>
  );
};

export const SelfCard = (props: {
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
      />
      <FTButton onClick={() => props.sender(userIdStr)}>Force Login</FTButton>
    </div>
  );
};
