import { ApiProperty } from '@nestjs/swagger';
import { MemberType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

export class RoomMemberDto {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @IsEnum(MemberType)
  @ApiProperty({ name: 'memberType', enum: MemberType })
  memberType?: MemberType;
}
