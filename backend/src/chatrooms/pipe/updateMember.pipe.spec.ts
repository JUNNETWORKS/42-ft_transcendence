import { ArgumentMetadata, HttpException } from '@nestjs/common';
import { RoomMemberDto } from '../dto/roomMember.dto';
import { UpdateMemberPipe } from './updateMember.pipe';

describe('UpdateMemberPipe', () => {
  it('should be defined', () => {
    expect(new UpdateMemberPipe()).toBeDefined();
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
