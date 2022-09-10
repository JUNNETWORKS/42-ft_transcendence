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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ChatroomsService } from './chatrooms.service';
import { CreateChatroomDto } from './dto/createChatroom.dto';
import { PostMessageDto } from './dto/postMessage.dto';
import { CreateRoomMemberDto } from './dto/createRoomMember.dto';
import { UpdateRoomNameDto } from './dto/updateRoomName.dto';
import { UpdateRoomTypeDto } from './dto/updateRoomType.dto';
import { ChatMessageEntity } from './entities/chatMessage.entity';
import { ChatroomEntity } from './entities/chatroom.entity';
import { chatUserRelationEntity } from './entities/chatUserRelation.entity';
import { CreateMemberPipe } from './pipe/createMember.pipe';
import { UpdateRoomTypePipe } from './pipe/updateRoomType.pipe';
import { RoomMemberDto } from './dto/roomMember.dto';
import { UpdateMemberPipe } from './pipe/updateMember.pipe';
import { GetMessagesDto } from './dto/getMessages.dto';

@Controller('chatrooms')
@ApiTags('chatrooms')
export class ChatroomsController {
  constructor(private readonly chatroomsService: ChatroomsService) {}

  @Post()
  @ApiCreatedResponse({ type: ChatroomEntity })
  create(
    @Body(new CreateMemberPipe(), new UpdateRoomTypePipe())
    createChatroomDto: CreateChatroomDto
  ) {
    return this.chatroomsService.create(createChatroomDto);
  }

  @Get()
  @ApiOkResponse({ type: ChatroomEntity, isArray: true })
  findAll() {
    return this.chatroomsService.findAll();
  }

  @Get('messages')
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ type: ChatMessageEntity, isArray: true })
  getMessagesByCursor(@Query() getMessageDto: GetMessagesDto) {
    const { roomId, take, cursor } = getMessageDto;
    return this.chatroomsService.getMessages(roomId, take, cursor);
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

  @Patch(':roomId/roomType')
  @ApiOkResponse({ type: ChatroomEntity })
  updateRoomType(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(new UpdateRoomTypePipe())
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
    @Body(new CreateMemberPipe()) createRoomMemberDto: CreateRoomMemberDto
  ) {
    return this.chatroomsService.addMember(roomId, createRoomMemberDto);
  }

  @Patch(':roomId/memberType')
  @ApiOkResponse({ type: ChatroomEntity })
  updateMember(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(new UpdateMemberPipe()) roomMemberDto: RoomMemberDto
  ) {
    return this.chatroomsService.updateMember(roomId, roomMemberDto);
  }

  @Delete(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  remove(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.remove(roomId);
  }

  @Post('/messages')
  @ApiCreatedResponse({ type: ChatMessageEntity })
  postMessage(@Body() postMessageDto: PostMessageDto) {
    return this.chatroomsService.postMessage(postMessageDto);
  }
}
