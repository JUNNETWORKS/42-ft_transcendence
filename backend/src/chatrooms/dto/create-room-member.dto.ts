import { PickType } from '@nestjs/swagger';
import { CreateChatroomDto } from './create-chatroom.dto';

export class CreateRoomMemberDto extends PickType(CreateChatroomDto, [
  'roomMember',
] as const) {}
