import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '@prisma/client';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateChatroomDto {
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty()
  roomName!: string;

  @IsNotEmpty()
  @ApiProperty({ name: 'roomType', enum: RoomType })
  roomType!: RoomType;

  @ApiProperty()
  roomPassword?: string;
}
