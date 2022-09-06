import { ApiProperty } from '@nestjs/swagger';
import { MemberType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class RoomMemberDto {
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
  @Type(() => Date)
  @ApiProperty()
  endAt?: Date;
}
