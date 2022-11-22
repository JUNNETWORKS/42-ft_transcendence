import {
  Controller,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { UpdateRoomDto } from './dto/update-room.dto';

import { ChatroomsService } from './chatrooms.service';
import { ChatroomEntity } from './entities/chatroom.entity';
import { UpdateRoomPipe } from './pipe/update-room.pipe';

@Controller('chatrooms')
@ApiTags('chatrooms')
export class ChatroomsController {
  constructor(private readonly chatroomsService: ChatroomsService) {}

  @Put(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  updateRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(new UpdateRoomPipe())
    updateRoomDto: UpdateRoomDto
  ) {
    console.log('updating:', updateRoomDto);
    return this.chatroomsService.updateRoom(roomId, updateRoomDto);
  }

  @Delete(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  remove(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.remove(roomId);
  }
}
