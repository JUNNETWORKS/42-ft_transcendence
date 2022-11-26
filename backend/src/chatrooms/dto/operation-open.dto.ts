import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  MaxLength,
  IsEnum,
} from 'class-validator';

const RoomTypes = ['PUBLIC', 'PRIVATE', 'LOCKED', 'DM'] as const;
export type RoomType = typeof RoomTypes[number];

export class OperationOpenDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  roomName!: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(RoomTypes)
  @ApiProperty()
  roomType!: RoomType;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  callerId!: number;
}
