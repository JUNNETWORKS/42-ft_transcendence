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
  isEnabledAvatar!: boolean;

  @ApiProperty()
  intraId!: number;

  @ApiProperty()
  password!: string;

  @ApiProperty()
  invalidateTokenIssuedBefore!: Date | null;

  @ApiProperty()
  pulseTime!: Date | null;
}

export type UserMinimum = Omit<User, 'id'>;
