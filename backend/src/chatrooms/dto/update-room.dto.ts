import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './create-chatroom.dto';

export class UpdateRoomDto extends PickType(CreateChatroomDto, [
  'roomName',
  'roomType',
  'roomPassword',
] as const) {}
