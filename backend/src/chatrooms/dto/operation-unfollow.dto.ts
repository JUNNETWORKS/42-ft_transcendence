import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class OperationUnfollowDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  userId!: number;
}
