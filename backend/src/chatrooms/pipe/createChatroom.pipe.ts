import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateChatroomDto } from '../dto/createChatroom.dto';

@Injectable()
export class CreateChatroomPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: CreateChatroomDto, metadata: ArgumentMetadata) {
    // members.userTypeにBANNED, MUTEDが入らないようにする。
    value.roomMember.forEach((roomMember) => {
      if (
        roomMember.memberType === 'BANNED' ||
        roomMember.memberType === 'MUTED'
      ) {
        throw new HttpException(
          'new chatroom member type must not be "BANNED" or "MUTED"',
          400
        );
      }
    });
    return value;
  }
}
