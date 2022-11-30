import { ApiProperty } from '@nestjs/swagger';

export const MessageTypes = [
  'JOINED',
  'LEFT',
  'NOMMINATED',
  'BANNED',
  'MUTED',
  'KICKED',
] as const;
export type MessageType = typeof MessageTypes[number];

export class ChatMessageEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  chatRoomId!: number;

  @ApiProperty()
  userId!: number;

  secondaryUserId?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  content!: string;

  messageType?: MessageType;
}
