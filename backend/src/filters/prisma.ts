import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as Utils from 'src/utils';
import * as express from 'express';

const code2message: { [key: string]: string } = {
  P2002: 'not_unique',
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  // `PrismaExceptionFilter` という名前だが, キャッチするのは `PrismaClientKnownRequestError` なので
  // 必要に応じて名前を変える事.
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<express.Response>();
    const messages = (() => {
      if (exception.meta && exception.meta.target) {
        // { [フィールド名]: "エラー名" } というmapを作って返す
        const errorMap = Utils.mapValues(
          Utils.keyBy(exception.meta.target as string[], (t) => t),
          () => code2message[exception.code] || 'unknown_error'
        );
        return errorMap;
      }
      return { _: 'unknown_error' };
    })();

    response.status(400).json(messages);
  }
}
