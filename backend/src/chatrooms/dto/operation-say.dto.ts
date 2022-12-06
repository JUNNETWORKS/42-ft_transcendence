import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';

export class OperationSayDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  roomId!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  content!: string;
}
