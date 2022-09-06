import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateChatroomDto } from '../dto/createChatroom.dto';

@Injectable()
export class CreateMemberPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: CreateChatroomDto, metadata: ArgumentMetadata) {
    // members.userTypeにBANNED, MUTEDが入らないようにする。
    for (const member of value.roomMember) {
      if (member.memberType === 'BANNED' || member.memberType === 'MUTED') {
        throw new HttpException(
          `new chatroom member type must not be "${member.memberType}"`,
          400
        );
      }
    }
    return value;
  }
}
