import { prisma } from "./src/lib/prisma";

async function main() {
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.user.deleteMany();
  console.log('All data wiped');
}

main().catch(console.error);
