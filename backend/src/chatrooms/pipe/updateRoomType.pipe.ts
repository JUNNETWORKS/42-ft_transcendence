import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { UpdateRoomTypeDto } from '../dto/updateRoomType.dto';

@Injectable()
export class UpdateRoomTypePipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: UpdateRoomTypeDto, metadata: ArgumentMetadata) {
    // roomTypeが"LOCKED"のときのみroomPasswordを許容する。
    if (value.roomType !== 'LOCKED' && 'roomPassword' in value) {
      throw new HttpException(
        'roomPassword is needed when roomType is only "LOCKED"',
        400
      );
    }
    if (value.roomType === 'LOCKED' && !('roomPassword' in value)) {
      throw new HttpException(
        'roomPassword is needed with "LOCKED" roomType',
        400
      );
    }
    return value;
  }
}
