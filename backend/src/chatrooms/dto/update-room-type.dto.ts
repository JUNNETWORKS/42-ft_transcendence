import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './create-chatroom.dto';

export class UpdateRoomTypeDto extends PickType(CreateChatroomDto, [
  'roomType',
  'roomPassword',
] as const) {}
