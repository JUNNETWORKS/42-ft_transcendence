import { ArgumentMetadata, HttpException } from '@nestjs/common';
import { CreateChatroomDto } from '../dto/create-chatroom.dto';
import { CreateChatroomPipe } from './create-chatroom.pipe';

describe('CreateChatroomPipe', () => {
  it('should be defined', () => {
    expect(new CreateChatroomPipe()).toBeDefined();
  });

  it('ownerはADMINでないとエラー', () => {
    const target = new CreateChatroomPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateChatroomDto,
      data: '',
    };
    const dto: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      ownerId: 1,
      roomMember: [{ userId: 1, memberType: 'MEMBER' }],
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(new HttpException('Owner must be admin.', 400));
  });
});
