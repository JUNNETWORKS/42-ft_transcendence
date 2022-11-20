import { OmitType } from '@nestjs/swagger';

import { CreateChatroomDto } from './create-chatroom.dto';

export class CreateChatroomApiDto extends OmitType(CreateChatroomDto, [
  'ownerId',
  'roomMember',
]) {}
