import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PongService } from './pong.service';

@ApiTags('Pong')
@Controller('pong')
export class PongController {
  constructor(private readonly pongService: PongService) {}
}
