import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class PostMessageDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  chatRoomId!: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  userId!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  content!: string;
}
