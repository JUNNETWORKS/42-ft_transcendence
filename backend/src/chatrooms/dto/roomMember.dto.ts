import { ApiProperty } from '@nestjs/swagger';
import { MemberType } from '@prisma/client';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class roomMemberDto {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @IsEnum(MemberType)
  @ApiProperty({ name: 'memberType', enum: MemberType })
  memberType?: MemberType;

  @IsOptional()
  @IsDate()
  @ApiProperty()
  endAt?: Date;
}
