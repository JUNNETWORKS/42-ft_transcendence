import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './createChatroom.dto';

export class UpdateRoomNameDto extends PickType(CreateChatroomDto, [
  'roomName',
] as const) {}
