import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const createMany = await prisma.user.createMany({
    data: [
      { displayName: 'Bob', email: 'bob@prisma.io' },
      { displayName: 'Bobo', email: 'bob@prisma.io' }, // Duplicate unique key!
      { displayName: 'Yewande', email: 'yewande@prisma.io' },
      { displayName: 'Angelique', email: 'angelique@prisma.io' },
    ],
    skipDuplicates: true, // Skip 'Bobo'
  });
  console.log(createMany);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
