import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { RoomMemberDto } from '../dto/room-member.dto';

@Injectable()
export class UpdateMemberPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: RoomMemberDto, metadata: ArgumentMetadata) {
    // Muted, Bannedのとき、endAtを確認する。
    if (
      (value.memberType === 'MUTED' || value.memberType === 'BANNED') &&
      !('endAt' in value)
    ) {
      throw new HttpException(
        `memberType "${value.memberType}" needs "endAt" value.`,
        400
      );
    }
    // それ以外の時、endAtがないことを確認する。
    if (
      !(value.memberType === 'MUTED' || value.memberType === 'BANNED') &&
      'endAt' in value
    ) {
      throw new HttpException(
        `memberType "${value.memberType}" does not need "endAt" value.`,
        400
      );
    }
    return value;
  }
}
