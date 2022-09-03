import { ArgumentMetadata, HttpException } from '@nestjs/common';
import { CreateChatroomDto } from '../dto/createChatroom.dto';
import { CreateChatroomPipe } from './createChatroom.pipe';

describe('CreateChatroomPipe', () => {
  it('should be defined', () => {
    expect(new CreateChatroomPipe()).toBeDefined();
  });

  it('members.userTypeにBANNED,MUTEDが入っている', async () => {
    const target: CreateChatroomPipe = new CreateChatroomPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      members: [
        { userId: 1, userType: 'ADMIN' },
        { userId: 2, userType: 'BANNED' },
      ],
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException(
        'new chatroom member type must not be "BANNED" or "MUTED"',
        400
      )
    );
  });

  it('roomPasswordが必要のないタイプのルームのプロパティにある。', async () => {
    const target: CreateChatroomPipe = new CreateChatroomPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      roomPassword: 'testpassword',
      members: [{ userId: 1, userType: 'ADMIN' }],
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException(
        'roomPassword is needed when roomType is only "LOCKED"',
        400
      )
    );
  });

  it('roomType LOCKED にroomPasswordがない', async () => {
    const target: CreateChatroomPipe = new CreateChatroomPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'LOCKED',
      members: [{ userId: 1, userType: 'ADMIN' }],
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException('roomPassword is needed with "LOCKED" roomType', 400)
    );
  });
});
