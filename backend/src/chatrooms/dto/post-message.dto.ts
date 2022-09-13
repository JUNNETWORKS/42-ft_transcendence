import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';

export class PostMessageDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  chatRoomId!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  content!: string;
}
