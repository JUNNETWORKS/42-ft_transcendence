import * as TD from '@/typedef';
import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { chatSocketAtom } from '@/stores/auth';
import { useAtom } from 'jotai';
import { dataAtom } from '@/stores/structure';
import { useState } from 'react';

type DmModalProps = {
  user: TD.User;
  onClose: () => void;
};

export const DmCard = ({ user, onClose }: DmModalProps) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [dmRooms] = useAtom(dataAtom.dmRoomsAtom);
  const [content, setContent] = useState('');
  if (!mySocket) {
    onClose();
    return null;
  }

  const dmRoomWithUser = () => {
    if (!dmRooms) return undefined;
    return dmRooms.find((room) => {
      const dmRoom = room;
      if (dmRoom.roomMember.find((member) => member.userId === user.id)) {
        return room;
      }
    });
  };

  const submit = () => {
    const dmRoom = dmRoomWithUser();
    if (dmRoom) {
      const data = {
        roomId: dmRoom?.id,
        content,
      };
      console.log(data);
      mySocket?.emit('ft_say', data);
    } else {
      const data = {
        userId: user.id,
        content: content,
      };
      console.log(data);
      mySocket?.emit('ft_tell', data);
    }
    // TODO: DMのルームに移動、フォーカス
    onClose();
  };

  return (
    <div className="flex w-[480px] flex-col justify-around gap-5 p-8">
      <p className="text-2xl">{user.displayName}へDMを送信</p>
      <FTTextField
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <FTButton onClick={submit} disabled={content === ''}>
        Send
      </FTButton>
    </div>
  );
};
