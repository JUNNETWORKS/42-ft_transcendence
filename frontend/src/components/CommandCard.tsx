import { useStateWithResetter } from '../hooks';
import * as TD from '../typedef';
import { FTTextField, FTButton, FTH4 } from './FTBasicComponents';

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
    isSendable: (() => {
      if (!content.trim()) {
        return false;
      }
      return true;
    })(),
  };

  return (
    <>
      <div className="shrink grow">
        <FTTextField
          className="block h-full w-full p-0 focus:bg-gray-700"
          autoComplete="off"
          value={content}
          placeholder="発言内容"
          onChange={(e) => setContent(e.target.value)}
          onEnter={() => {
            if (computed.isSendable) {
              sender();
            }
          }}
        />
      </div>
      <div className="shrink-0 grow-0 p-[2px] pl-2">
        <FTButton disabled={!computed.isSendable} onClick={sender}>
          Send
        </FTButton>
      </div>
    </>
  );
};
