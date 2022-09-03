import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
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
  @ApiProperty({ name: 'userType', enum: UserType })
  userType?: UserType;
}
