import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsString, IsOptional } from 'class-validator';

export class OperationJoinDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  roomId!: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  roomPassword?: string;
}
