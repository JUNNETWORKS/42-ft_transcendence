import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class roomMemberEntity {
  @ApiProperty()
  userId!: number;

  @ApiProperty({ name: 'userType', enum: UserType })
  userType?: UserType;
}
