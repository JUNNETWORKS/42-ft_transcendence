import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class UserFindManyDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  take!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ required: false })
  cursor?: number;
}
