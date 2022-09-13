import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  chatRoomId!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  content!: string;
}
