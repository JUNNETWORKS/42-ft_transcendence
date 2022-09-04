import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './createChatroom.dto';

export class UpdateRoomTypeDto extends PickType(CreateChatroomDto, [
  'roomType',
  'roomPassword',
] as const) {}