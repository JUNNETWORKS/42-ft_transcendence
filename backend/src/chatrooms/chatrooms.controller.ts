import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ChatroomsService } from './chatrooms.service';
import { CreateChatroomDto } from './dto/createChatroom.dto';
import { PostMessageDto } from './dto/postMessage.dto';
import { UpdateChatroomDto } from './dto/updateChatroom.dto';
import { ChatroomEntity } from './entities/chatroom.entity';
import { chatUserRelationEntity } from './entities/chatUserRelation.entity';
import { CreateChatroomPipe } from './pipe/createChatroom.pipe';

@Controller('chatrooms')
@ApiTags('chatrooms')
export class ChatroomsController {
  constructor(private readonly chatroomsService: ChatroomsService) {}

  @Post()
  @ApiCreatedResponse({ type: ChatroomEntity })
  create(
    @Body(ValidationPipe, new CreateChatroomPipe())
    createChatroomDto: CreateChatroomDto
  ) {
    return this.chatroomsService.create(createChatroomDto);
  }

  @Get()
  @ApiOkResponse({ type: ChatroomEntity, isArray: true })
  findAll() {
    return this.chatroomsService.findAll();
  }

  @Get(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  findOne(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.findOne(roomId);
  }

  @Patch(':roomId/join')
  @ApiOkResponse({ type: chatUserRelationEntity })
  join(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('userId', ParseIntPipe) userId: number
  ) {
    return this.chatroomsService.join(roomId, userId);
  }

  @Patch(':roomId/leave')
  @ApiOkResponse({ type: chatUserRelationEntity })
  leave(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('userId', ParseIntPipe) userId: number
  ) {
    return this.chatroomsService.leave(roomId, userId);
  }

  @Patch(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  update(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() updateChatroomDto: UpdateChatroomDto
  ) {
    return this.chatroomsService.update(roomId, updateChatroomDto);
  }

  @Delete(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  remove(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.remove(roomId);
  }

  @Get(':roomId/messagesbycursor')
  getMessagesByCursor(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number
  ) {
    return this.chatroomsService.getMessagesByCursor(roomId, take, cursor);
  }

  @Get(':roomId/messages')
  getMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('take', ParseIntPipe) take: number
  ) {
    return this.chatroomsService.getMessages(roomId, take);
  }

  @Post('/messages')
  postMessage(@Body() postMessageDto: PostMessageDto) {
    return this.chatroomsService.postMessage(postMessageDto);
  }
}
