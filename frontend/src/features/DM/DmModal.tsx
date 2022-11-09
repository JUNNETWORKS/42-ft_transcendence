import * as TD from '@/typedef';
import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { chatSocketAtom } from '@/stores/auth';
import { useAtom } from 'jotai';

type DmModalProps = {
  user: TD.User;
  onClose: () => void;
};

export const DmModal = ({ user, onClose }: DmModalProps) => {
  const [mySocket] = useAtom(chatSocketAtom);
  if (!mySocket) {
    onClose();
    return null;
  }

  // 新規DM --> ルーム作成、メッセージ送信
  // DMがすでに存在 -> メッセージ送信
  const submit = () => {
    // DMのルームの存在確認
    // ない場合、ルームを作成
    // DMの送信
    // DMのルームに移動、フォーカス
    onClose();
  };

  return (
    <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
      <p className="text-2xl">{user.displayName}へDMを送信</p>
      <FTTextField />
      <FTButton onClick={submit}>Send</FTButton>
    </div>
  );
};
