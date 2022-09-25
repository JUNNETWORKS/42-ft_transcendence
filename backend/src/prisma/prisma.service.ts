import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel>
  implements OnModuleInit
{
  // private readonly logger = new Logger(PrismaService.name);
  // constructor() {
  //   super({ log: ['query', 'info', 'warn', 'error'] });
  // }
  async onModuleInit() {
    //   this.$on('query', (event) => {
    //     this.logger.log(
    //       `Query: ${event.query}`,
    //       `Params: ${event.params}`,
    //       `Duration: ${event.duration} ms`
    //     );
    //   });
    //   this.$on('info', (event) => {
    //     this.logger.log(`message: ${event.message}`);
    //   });
    //   this.$on('error', (event) => {
    //     this.logger.log(`error: ${event.message}`);
    //   });
    //   this.$on('warn', (event) => {
    //     this.logger.log(`warn: ${event.message}`);
    //   });
    await this.$connect();
  }
  async enableShutdownHook(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
