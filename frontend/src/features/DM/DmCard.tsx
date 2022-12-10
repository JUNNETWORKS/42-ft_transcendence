import { useAtom } from 'jotai';
import { useState } from 'react';

import { FTButton, FTTextField } from '@/components/FTBasicComponents';
import { chatSocketAtom } from '@/stores/auth';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';

type DmModalProps = {
  user: TD.User;
};

export const DmCard = ({ user }: DmModalProps) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [dmRooms] = useAtom(dataAtom.dmRoomsAtom);
  const [content, setContent] = useState('');
  if (!mySocket) {
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
  };
  const isSendable = content !== '';

  return (
    <>
      <div className="flex flex-row">
        <FTTextField
          className="shrink grow"
          value={content}
          placeholder="発言内容"
          onChange={(e) => setContent(e.target.value)}
          onEnter={() => {
            if (isSendable) {
              submit();
            }
          }}
        />
        <div className="shrink-0 grow-0 pl-2">
          <FTButton onClick={submit} disabled={!isSendable}>
            Send
          </FTButton>
        </div>
      </div>
    </>
  );
};
