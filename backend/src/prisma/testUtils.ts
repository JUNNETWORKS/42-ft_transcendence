import { Prisma, PrismaClient } from '@prisma/client';

export const resetTable = async (
  modelNames: Prisma.ModelName[]
): Promise<void> => {
  const tablenames = modelNames.map((modelName) => ({ tablename: modelName }));
  const prisma = new PrismaClient();
  for (const { tablename } of tablenames) {
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
      );
    } catch (error) {
      console.log({ error });
    }
  }
  prisma.$disconnect();
};
