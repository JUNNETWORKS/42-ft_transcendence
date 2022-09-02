import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '@prisma/client';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { roomMemberDto } from './roomMember.dto';

export class CreateChatroomDto {
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty()
  roomName!: string;

  @IsNotEmpty()
  @ApiProperty({ name: 'roomType', enum: RoomType })
  roomType!: RoomType;

  @IsOptional()
  @ApiProperty()
  roomPassword?: string;

  @IsNotEmpty()
  @ApiProperty({ type: [roomMemberDto] })
  members!: roomMemberDto[];
}
