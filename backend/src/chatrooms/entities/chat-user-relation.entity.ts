import { ApiProperty } from '@nestjs/swagger';
import { ChatUserRelation, MemberType } from '@prisma/client';

export class chatUserRelationEntity implements ChatUserRelation {
  @ApiProperty()
  userId!: number;

  @ApiProperty()
  chatRoomId!: number;

  @ApiProperty({ name: 'memberType', enum: MemberType })
  memberType!: MemberType;

  @ApiProperty()
  endAt!: Date;
}
