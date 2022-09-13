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
    if (
      !value.roomMember.includes({
        userId: value.ownerId,
        memberType: 'ADMIN',
      })
    ) {
      throw new HttpException('Owner must be admin.', 400);
    }
    return value;
  }
}
