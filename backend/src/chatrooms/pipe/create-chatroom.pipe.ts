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
    console.log('value:', value);
    if (value.roomType !== 'LOCKED' && value.roomPassword) {
      throw new HttpException(
        'roomPassword is needed when roomType is only "LOCKED"',
        400
      );
    }
    if (value.roomType === 'LOCKED' && !value.roomPassword) {
      throw new HttpException(
        'roomPassword is needed with "LOCKED" roomType',
        400
      );
    }
    return value;
  }
}
