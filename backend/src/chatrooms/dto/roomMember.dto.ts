import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class roomMemberDto {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @IsEnum(UserType)
  @ApiProperty({ name: 'userType', enum: UserType })
  userType?: UserType;

  @IsOptional()
  @IsDate()
  @ApiProperty()
  endAt?: Date;
}
