import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateChatroomDto } from '../dto/create-chatroom.dto';

@Injectable()
export class CreateChatroomPipe implements PipeTransform {
  transform(value: CreateChatroomDto, metadata: ArgumentMetadata) {
    // members.userTypeにBANNED, MUTEDが入らないようにする。
    value.members.forEach((roomMember) => {
      if (roomMember.userType === 'BANNED' || roomMember.userType === 'MUTED') {
        throw new HttpException(
          'new chatroom member type must not be "BANNED" or "MUTED"',
          400
        );
      }
    });
    // roomTypeが"LOCKED"のときのみroomPasswordを許容する。
    if (value.roomType !== 'LOCKED' && 'roomPassword' in value) {
      throw new HttpException(
        'roomPassword is needed when roomType is only "LOCKED"',
        400
      );
    } else if (!('roomPassword' in value)) {
      throw new HttpException(
        'roomPassword is needed with "LOCKED" roomType',
        400
      );
    }
    return value;
  }
}
