import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  MaxLength,
  IsOptional,
  IsObject,
} from 'class-validator';

import { MessageType, MessageTypes } from '../entities/chat-message.entity';

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  secondaryUserId?: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  content!: string;

  @IsOptional()
  @IsString({
    groups: [...MessageTypes],
  })
  messageType?: MessageType;

  @IsOptional()
  @IsObject()
  subpayload?: any;
}
