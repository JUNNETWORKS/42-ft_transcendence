import { PartialType } from '@nestjs/swagger';
import { CreateChatroomDto } from './createChatroom.dto';

export class UpdateChatroomDto extends PartialType(CreateChatroomDto) {}
