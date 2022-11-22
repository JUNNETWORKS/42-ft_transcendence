import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class GetChatroomsDto {
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

  @IsOptional()
  @IsString({
    groups: ['DM', 'PRIVATE'],
  })
  @ApiProperty({ required: false })
  category?: 'DM' | 'PRIVATE';

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  userId?: number;
}
