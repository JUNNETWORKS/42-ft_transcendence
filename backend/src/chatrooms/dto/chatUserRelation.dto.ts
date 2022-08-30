import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class ChatUserRelationDto {
  @IsNotEmpty()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @ApiProperty()
  chatRoomId!: number;

  @IsNotEmpty()
  @ApiProperty({ name: 'userType', enum: UserType })
  userType?: UserType;
}
