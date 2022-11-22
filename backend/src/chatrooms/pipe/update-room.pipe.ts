import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { UpdateRoomDto } from '../dto/update-room.dto';

@Injectable()
export class UpdateRoomPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: UpdateRoomDto, metadata: ArgumentMetadata) {
    // roomTypeが"LOCKED"のときのみroomPasswordを許容する。
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
