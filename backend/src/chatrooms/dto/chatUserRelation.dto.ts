import { ApiProperty } from '@nestjs/swagger';
import { MemberType } from '@prisma/client';
import { IsInt, IsNotEmpty, ValidateNested } from 'class-validator';

export class ChatUserRelationDto {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  chatRoomId!: number;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({ name: 'userType', enum: MemberType })
  memberType?: MemberType;
}
