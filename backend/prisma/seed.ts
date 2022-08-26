import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const createMany = await prisma.user.createMany({
    data: [
      { display_name: 'Bob', email: 'bob@prisma.io' },
      { display_name: 'Bobo', email: 'bob@prisma.io' }, // Duplicate unique key!
      { display_name: 'Yewande', email: 'yewande@prisma.io' },
      { display_name: 'Angelique', email: 'angelique@prisma.io' },
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
