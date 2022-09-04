import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRoomTypeDto {
  @IsNotEmpty()
  @IsEnum(RoomType)
  @ApiProperty({ name: 'roomType', enum: RoomType })
  roomType!: RoomType;

  @IsOptional()
  @IsString()
  @ApiProperty()
  roomPassword?: string;
}
