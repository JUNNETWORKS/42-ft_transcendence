import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserNameDto extends PickType(CreateUserDto, [
  'displayName',
]) {}
