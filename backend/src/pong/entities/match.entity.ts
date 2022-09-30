import { ApiProperty } from '@nestjs/swagger';
import { Match } from '@prisma/client';

export class MatchEntity implements Match {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  beginDate!: Date;
}
