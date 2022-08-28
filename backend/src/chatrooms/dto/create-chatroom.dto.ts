import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateChatroomDto {
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty()
  roomName!: string;
}
