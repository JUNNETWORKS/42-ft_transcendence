import { ApiProperty } from '@nestjs/swagger';
import { ChatUserAttribute } from '@prisma/client';

export class ChatUserAttributeEntity implements ChatUserAttribute {
  @ApiProperty()
  userId!: number;

  @ApiProperty()
  chatRoomId!: number;

  @ApiProperty()
  bannedEndAt!: Date;

  @ApiProperty()
  mutedEndAt!: Date;

  @ApiProperty()
  readenUntil!: number;
}
