import { ApiProperty } from '@nestjs/swagger';

export const MessageTypesSingle = [
  'OPENED',
  'JOINED',
  'LEFT',
  'PR_OPEN',
  'PR_CANCEL',
] as const;
export const MessageTypesWithPayload = ['UPDATED'] as const;
export const MessageTypesWithTarget = [
  'NOMMINATED',
  'BANNED',
  'MUTED',
  'KICKED',
  'PR_START',
  'PR_RESULT',
] as const;
export const MessageTypes = [
  ...MessageTypesSingle,
  ...MessageTypesWithPayload,
  ...MessageTypesWithTarget,
] as const;

export type MessageTypeSingle = typeof MessageTypesSingle[number];
export type MessageTypeWithPayload = typeof MessageTypesWithPayload[number];
export type MessageTypeWithTarget = typeof MessageTypesWithTarget[number];
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
