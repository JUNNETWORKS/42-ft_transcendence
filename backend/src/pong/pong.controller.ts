import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PongService } from './pong.service';

@ApiTags('Pong')
@Controller('pong')
export class PongController {
  constructor(private readonly pongService: PongService) {}
}
