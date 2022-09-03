import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { roomMemberDto } from './roomMember.dto';

export class CreateChatroomDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @ApiProperty()
  roomName!: string;

  @IsNotEmpty()
  @ApiProperty({ name: 'roomType', enum: RoomType })
  roomType!: RoomType;

  @IsOptional()
  @IsString()
  @ApiProperty()
  roomPassword?: string;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({ type: [roomMemberDto] })
  members!: roomMemberDto[];
}
