import * as TD from '@/typedef';
import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { chatSocketAtom } from '@/stores/auth';
import { useAtom } from 'jotai';
import { dataAtom } from '@/stores/structure';

type DmModalProps = {
  user: TD.User;
  onClose: () => void;
};

export const DmModal = ({ user, onClose }: DmModalProps) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [dmRooms] = useAtom(dataAtom.dmRoomsAtom);
  if (!mySocket) {
    onClose();
    return null;
  }

  const dmRoomWithUser = () => {
    if (!dmRooms) return undefined;
    return dmRooms.find((room) => {
      // TODO: dmRoomの方をDmRoomに変更
      const dmRoom = room as TD.DmRoom;
      if (dmRoom.roomMember.find((member) => member.userId === user.id)) {
        return room;
      }
    });
  };

  // 新規DM --> ルーム作成、メッセージ送信
  // DMがすでに存在 -> メッセージ送信
  const submit = () => {
    // DMのルームの存在確認
    const dmRoom = dmRoomWithUser();
    if (!dmRoom) {
      // ない場合、ルームを作成
    }
    // DMの送信
    // TODO: DMのルームに移動、フォーカス
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
