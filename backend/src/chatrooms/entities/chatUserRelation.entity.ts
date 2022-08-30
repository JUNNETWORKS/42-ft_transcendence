import { ApiProperty } from '@nestjs/swagger';
import { ChatUserRelation, UserType } from '@prisma/client';

export class chatUserRelationEntity implements ChatUserRelation {
  @ApiProperty()
  userId!: number;

  @ApiProperty()
  chatRoomId!: number;

  @ApiProperty()
  userType!: UserType;

  @ApiProperty()
  endAt!: Date;
}
