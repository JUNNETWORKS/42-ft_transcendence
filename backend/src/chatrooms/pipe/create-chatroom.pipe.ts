import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { CreateChatroomDto } from '../dto/create-chatroom.dto';

@Injectable()
export class CreateChatroomPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: CreateChatroomDto, metadata: ArgumentMetadata) {
    const found = value.roomMember.find(
      (member) => member.userId === value.ownerId
    );
    if (!found) {
      throw new HttpException('Owner must be member of room.', 400);
    }
    for (const member of value.roomMember) {
      if (member.userId === value.ownerId && member.memberType !== 'ADMIN') {
        throw new HttpException('Owner must be admin.', 400);
      }
    }
    return value;
  }
}
