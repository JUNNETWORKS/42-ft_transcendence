import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class OperationNomminateDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  roomId!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  userId!: number;
}
