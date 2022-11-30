import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { keyBy } from 'src/utils';

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
    if (value.roomPassword) {
      const characters = Object.keys(
        keyBy(value.roomPassword.split(''), (c) => c)
      ).length;
      if (characters < 4) {
        throw new HttpException(
          'roomPassword must be consisted by more than 4 types of characters',
          400
        );
      }
    }
    return value;
  }
}
