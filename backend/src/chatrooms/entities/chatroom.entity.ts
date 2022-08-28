import { ApiProperty } from '@nestjs/swagger';
import { ChatRoom } from '@prisma/client';

export class ChatroomEntity implements ChatRoom {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  roomName!: string;

  @ApiProperty()
  createdAt!: Date;
}
