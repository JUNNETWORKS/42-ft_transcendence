import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class CreateChatUserRelationDto {
  @IsNotEmpty()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @ApiProperty()
  chatRoomId!: number;

  @IsNotEmpty()
  @ApiProperty()
  userType?: UserType;
}
