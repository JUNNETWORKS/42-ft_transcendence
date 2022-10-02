import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RoomMemberDto } from './room-member.dto';

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
  @IsInt()
  @IsPositive()
  @ApiProperty()
  ownerId!: number;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RoomMemberDto)
  @ApiProperty({ type: [RoomMemberDto] })
  roomMember!: RoomMemberDto[];
}
