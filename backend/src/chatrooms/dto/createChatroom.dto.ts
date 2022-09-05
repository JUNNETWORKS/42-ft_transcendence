import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RoomMemberDto } from './roomMember.dto';

export class CreateChatroomDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  @ApiProperty()
  roomName!: string;

  @IsNotEmpty()
  @IsEnum(RoomType)
  @ApiProperty({ name: 'roomType', enum: RoomType })
  roomType!: RoomType;

  @IsOptional()
  @IsString()
  @ApiProperty()
  roomPassword?: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RoomMemberDto)
  @ApiProperty({ type: [RoomMemberDto] })
  roomMember!: RoomMemberDto[];
}
