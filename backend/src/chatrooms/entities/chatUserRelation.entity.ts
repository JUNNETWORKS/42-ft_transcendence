import { ApiProperty } from '@nestjs/swagger';
import { ChatUserRelation, MemberType } from '@prisma/client';

export class chatUserRelationEntity implements ChatUserRelation {
  @ApiProperty()
  userId!: number;

  @ApiProperty()
  chatRoomId!: number;

  @ApiProperty({ name: 'userType', enum: MemberType })
  memberType!: MemberType;

  @ApiProperty()
  endAt!: Date;
}
