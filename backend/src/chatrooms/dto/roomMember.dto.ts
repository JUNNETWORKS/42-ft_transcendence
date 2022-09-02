import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class roomMemberDto {
  @IsNotEmpty()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @ApiProperty({ name: 'userType', enum: UserType })
  userType?: UserType;

  @IsOptional()
  @ApiProperty()
  endAt?: Date;
}
