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
import { UpdateRoomMemberDto } from './dto/updateAddMember.dto';
import { UpdateChatroomDto } from './dto/updateChatroom.dto';
import { UpdateRoomNameDto } from './dto/updateRoomName.dto';
import { UpdateRoomTypeDto } from './dto/updateRoomType.dto';
import { ChatMessageEntity } from './entities/chatMessage.entity';
import { ChatroomEntity } from './entities/chatroom.entity';
import { chatUserRelationEntity } from './entities/chatUserRelation.entity';
import { memberTypeValidationPipe } from './pipe/memberTypeValidation.pipe';
import { UpdateRoomTypePipe } from './pipe/roomTypeValidation.pipe';

@Controller('chatrooms')
@ApiTags('chatrooms')
export class ChatroomsController {
  constructor(private readonly chatroomsService: ChatroomsService) {}

  @Post()
  @ApiCreatedResponse({ type: ChatroomEntity })
  create(
    @Body(
      ValidationPipe,
      new memberTypeValidationPipe(),
      new UpdateRoomTypePipe()
    )
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

  @Get(':roomId/members')
  @ApiOkResponse({ type: chatUserRelationEntity, isArray: true })
  getMembers(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.getMembers(roomId);
  }

  @Patch(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  update(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() updateChatroomDto: UpdateChatroomDto
  ) {
    return this.chatroomsService.update(roomId, updateChatroomDto);
  }

  @Patch(':roomId/roomType')
  @ApiOkResponse({ type: ChatroomEntity })
  updateRoomType(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(ValidationPipe, new UpdateRoomTypePipe())
    updateRoomTypeDto: UpdateRoomTypeDto
  ) {
    return this.chatroomsService.updateRoomType(roomId, updateRoomTypeDto);
  }

  @Patch(':roomId/roomName')
  @ApiOkResponse({ type: ChatroomEntity })
  updateRoomName(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() updateRoomNameDto: UpdateRoomNameDto
  ) {
    return this.chatroomsService.updateRoomName(roomId, updateRoomNameDto);
  }

  @Patch(':roomId/addMember')
  @ApiOkResponse({ type: ChatroomEntity })
  addMember(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() updateRoomMemberDto: UpdateRoomMemberDto
  ) {
    return this.chatroomsService.addMember(roomId, updateRoomMemberDto);
  }

  @Delete(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  remove(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.remove(roomId);
  }

  @Get(':roomId/messagesbycursor')
  @ApiOkResponse({ type: ChatMessageEntity, isArray: true })
  getMessagesByCursor(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('take', ParseIntPipe) take: number,
    @Query('cursor', ParseIntPipe) cursor: number
  ) {
    return this.chatroomsService.getMessagesByCursor(roomId, take, cursor);
  }

  @Get(':roomId/messages')
  @ApiOkResponse({ type: ChatMessageEntity, isArray: true })
  getMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('take', ParseIntPipe) take: number
  ) {
    return this.chatroomsService.getMessages(roomId, take);
  }

  @Post('/messages')
  @ApiCreatedResponse({ type: ChatMessageEntity })
  postMessage(@Body() postMessageDto: PostMessageDto) {
    return this.chatroomsService.postMessage(postMessageDto);
  }
}