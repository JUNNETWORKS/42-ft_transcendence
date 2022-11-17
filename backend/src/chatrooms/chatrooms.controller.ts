import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Put,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ChatroomsService } from './chatrooms.service';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { UpdateRoomNameDto } from './dto/update-room-name.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatroomEntity } from './entities/chatroom.entity';
import { ChatUserRelationEntity } from './entities/chat-user-relation.entity';
import { UpdateRoomTypePipe } from './pipe/update-room-type.pipe';
import { RoomMemberDto } from './dto/room-member.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { CreateChatroomPipe } from './pipe/create-chatroom.pipe';
import { GetChatroomsDto } from './dto/get-chatrooms.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomPipe } from './pipe/update-room.pipe';

@Controller('chatrooms')
@ApiTags('chatrooms')
export class ChatroomsController {
  constructor(private readonly chatroomsService: ChatroomsService) {}

  @Post()
  @ApiCreatedResponse({ type: ChatroomEntity })
  create(
    @Body(new UpdateRoomTypePipe(), new CreateChatroomPipe())
    createChatroomDto: CreateChatroomDto
  ) {
    return this.chatroomsService.create(createChatroomDto);
  }

  @Get()
  @ApiOkResponse({ type: ChatroomEntity, isArray: true })
  findMany(@Query() getChatroomsDto: GetChatroomsDto) {
    return this.chatroomsService.findMany(getChatroomsDto);
  }

  @Get('messages')
  @ApiOkResponse({ type: ChatMessageEntity, isArray: true })
  getMessages(@Query() getMessageDto: GetMessagesDto) {
    return this.chatroomsService.getMessages(getMessageDto);
  }

  @Get(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  findOne(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.findOne(roomId);
  }

  @Put(':roomId/join')
  @ApiOkResponse({ type: ChatUserRelationEntity })
  join(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('userId', ParseIntPipe) userId: number
  ) {
    return this.chatroomsService.join(roomId, userId);
  }

  @Delete(':roomId/leave')
  @ApiOkResponse({ type: ChatUserRelationEntity })
  leave(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('userId', ParseIntPipe) userId: number
  ) {
    return this.chatroomsService.leave(roomId, userId);
  }

  @Get(':roomId/members')
  @ApiOkResponse({ type: ChatUserRelationEntity, isArray: true })
  getMembers(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.chatroomsService.getMembers(roomId);
  }

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

  @Put(':roomId/roomType')
  @ApiOkResponse({ type: ChatroomEntity })
  updateRoomType(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(new UpdateRoomTypePipe())
    updateRoomTypeDto: UpdateRoomTypeDto
  ) {
    return this.chatroomsService.updateRoomType(roomId, updateRoomTypeDto);
  }

  @Put(':roomId/roomName')
  @ApiOkResponse({ type: ChatroomEntity })
  updateRoomName(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() updateRoomNameDto: UpdateRoomNameDto
  ) {
    return this.chatroomsService.updateRoomName(roomId, updateRoomNameDto);
  }

  @Put(':roomId/addMember')
  @ApiOkResponse({ type: ChatroomEntity })
  addMember(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() createRoomMemberDto: CreateRoomMemberDto
  ) {
    return this.chatroomsService.addMember(roomId, createRoomMemberDto);
  }

  @Put(':roomId/memberType')
  @ApiOkResponse({ type: ChatroomEntity })
  updateMember(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() roomMemberDto: RoomMemberDto
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
