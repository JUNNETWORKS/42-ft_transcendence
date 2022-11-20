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
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatGateway } from 'src/chat/chat.gateway';
import { pick } from 'src/utils';

import { CreateChatroomApiDto } from './dto/create-chatroom-api.dto';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { GetChatroomsDto } from './dto/get-chatrooms.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { PostMessageDto } from './dto/post-message.dto';
import { RoomMemberDto } from './dto/room-member.dto';
import { UpdateRoomNameDto } from './dto/update-room-name.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

import { ChatroomsService } from './chatrooms.service';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatUserRelationEntity } from './entities/chat-user-relation.entity';
import { ChatroomEntity } from './entities/chatroom.entity';
import { CreateChatroomPipe } from './pipe/create-chatroom.pipe';
import { UpdateRoomTypePipe } from './pipe/update-room-type.pipe';
import { UpdateRoomPipe } from './pipe/update-room.pipe';

@Controller('chatrooms')
@ApiTags('chatrooms')
export class ChatroomsController {
  constructor(
    private readonly chatroomsService: ChatroomsService,
    private readonly charGateway: ChatGateway
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiCreatedResponse({ type: ChatroomEntity })
  async create(
    @Request() req: any,
    @Body(new CreateChatroomPipe(), new CreateChatroomPipe())
    createChatroomDto: CreateChatroomApiDto
  ) {
    const ownerId = req.user.id;
    const owner: RoomMemberDto = {
      userId: ownerId,
      memberType: 'ADMIN',
    };
    const result = await this.chatroomsService.create({
      ...createChatroomDto,
      ownerId,
      roomMember: [owner],
    });
    this.charGateway.sendResults(
      'ft_open',
      {
        ...pick(result, 'id', 'roomName', 'roomType', 'ownerId'),
      },
      result.roomType === 'PRIVATE' ? { userId: ownerId } : { global: 'global' }
    );
    return result;
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

  @UseGuards(JwtAuthGuard)
  @Put(':roomId')
  @ApiOkResponse({ type: ChatroomEntity })
  async updateRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body(new UpdateRoomPipe())
    updateRoomDto: UpdateRoomDto
  ) {
    console.log('updating:', updateRoomDto);
    const result = await this.chatroomsService.updateRoom(
      roomId,
      updateRoomDto
    );
    this.charGateway.sendResults(
      'ft_chatroom',
      {
        action: 'update',
        id: result.id,
        data: { ...pick(result, 'roomName', 'roomType', 'ownerId') },
      },
      result.roomType === 'PRIVATE'
        ? { roomId: result.id }
        : { global: 'global' }
    );
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
