import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './createChatroom.dto';

export class UpdateRoomMemberDto extends PickType(CreateChatroomDto, [
  'roomMember',
] as const) {}
