import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '@prisma/client';

// TODO: roomPasswordを含まずにimplements ChatRoomが使えるか調べる。
export class ChatroomEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  roomName!: string;

  @ApiProperty()
  roomType!: RoomType;

  @ApiProperty()
  createdAt!: Date;
}
