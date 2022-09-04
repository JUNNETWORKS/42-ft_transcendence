import { ApiProperty } from '@nestjs/swagger';
import { ChatRoom, RoomType } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class ChatroomEntity implements ChatRoom {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  roomName!: string;

  @ApiProperty()
  roomType!: RoomType;

  @Exclude()
  roomPassword!: string | null;

  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<ChatroomEntity>) {
    Object.assign(this, partial);
  }
}
