import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class verifyOtpDto {
  @ApiProperty()
  @IsString()
  otp!: string;
}
