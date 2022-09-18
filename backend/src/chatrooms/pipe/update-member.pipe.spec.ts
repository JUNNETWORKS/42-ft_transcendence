import { ArgumentMetadata, HttpException } from '@nestjs/common';
import { RoomMemberDto } from '../dto/room-member.dto';
import { UpdateMemberPipe } from './update-member.pipe';

describe('UpdateMemberPipe', () => {
  it('success ADMIN', () => {
    const target: UpdateMemberPipe = new UpdateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: RoomMemberDto,
      data: '',
    };
    const dto: RoomMemberDto = {
      userId: 1,
      memberType: 'ADMIN',
    };

    expect(target.transform(dto, metadata)).toEqual(dto);
  });

  it('success BANNED', () => {
    const target: UpdateMemberPipe = new UpdateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: RoomMemberDto,
      data: '',
    };
    const dto: RoomMemberDto = {
      userId: 1,
      memberType: 'BANNED',
      endAt: new Date(),
    };

    expect(target.transform(dto, metadata)).toEqual(dto);
  });

  it('membertypeがBANNED、MUTEDのときendAtがないとエラー', () => {
    const target: UpdateMemberPipe = new UpdateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: RoomMemberDto,
      data: '',
    };
    const dto: RoomMemberDto = {
      userId: 1,
      memberType: 'BANNED',
    };

    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException('memberType "BANNED" needs "endAt" value.', 400)
    );

    dto.memberType = 'MUTED';
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException('memberType "MUTED" needs "endAt" value.', 400)
    );
  });

  it('membertypeがBANNED、MUTED以外の時endAtがあるとエラー', () => {
    const target: UpdateMemberPipe = new UpdateMemberPipe();
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: RoomMemberDto,
      data: '',
    };
    const dto: RoomMemberDto = {
      userId: 1,
      memberType: 'ADMIN',
      endAt: new Date(),
    };
    expect(() => {
      target.transform(dto, metadata);
    }).toThrow(
      new HttpException('memberType "ADMIN" does not need "endAt" value.', 400)
    );
  });
});
