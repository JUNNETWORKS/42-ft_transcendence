import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class verifyOtpDto {
  @ApiProperty()
  @IsNumber()
  userId!: number;

  @ApiProperty()
  @IsString()
  otp!: string;
}
