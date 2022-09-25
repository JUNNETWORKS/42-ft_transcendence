import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './create-chatroom.dto';

export class UpdateRoomNameDto extends PickType(CreateChatroomDto, [
  'roomName',
] as const) {}
