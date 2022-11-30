import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsString, IsOptional } from 'class-validator';

import { MessageType, MessageTypes } from '../entities/chat-message.entity';

export class OperationSystemSayDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  roomId!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  callerId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  secondaryId?: number;

  @IsNotEmpty()
  @IsString({
    groups: [...MessageTypes],
  })
  messageType!: MessageType;
}
