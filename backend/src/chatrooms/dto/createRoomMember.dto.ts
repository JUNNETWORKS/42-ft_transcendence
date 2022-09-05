import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './createChatroom.dto';

export class CreateRoomMemberDto extends PickType(CreateChatroomDto, [
  'roomMember',
] as const) {}
