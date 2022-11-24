import {
  ArgumentMetadata,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { keyBy } from 'src/utils';

import { UpdateMePasswordDto } from '../dto/update-me-password.dto';

@Injectable()
export class UpdatePasswordPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: UpdateMePasswordDto, metadata: ArgumentMetadata) {
    const policy = {
      min: 12,
      max: 60,
      types: 4,
      usableCharacters: /^[A-Za-z0-9/_-]+$/,
    };
    const n = value.password.length;
    if (n < policy.min) {
      throw new HttpException(
        'password must have at least 12 characters.',
        400
      );
    }
    if (policy.max < n) {
      throw new HttpException('password must have at most 60 characters.', 400);
    }
    const characters = Object.keys(keyBy(value.password.split(''), (c) => c));
    if (characters.length < policy.types) {
      throw new HttpException(
        'password must have at least 4 types of characters.',
        400
      );
    }
    if (!value.password.match(policy.usableCharacters)) {
      throw new HttpException(
        'password must consist of characters in this set: `[A-Za-z0-9/_-]`',
        400
      );
    }
    return value;
  }
}
