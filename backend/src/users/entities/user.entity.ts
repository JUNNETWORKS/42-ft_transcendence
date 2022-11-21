import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class UserEntity implements User {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  isEnabled2FA!: boolean;

  @ApiProperty()
  intraId!: number;

  @ApiProperty()
  password!: string;
}

export type UserMinimum = Omit<User, 'id'>;
