const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  prisma.arbitrageOpportunity.deleteMany()
    .then((r) => console.log(r))
    .catch((e) => console.error(e))
    .finally(() => console.log('finished'));

  const res = await prisma.arbitrageOpportunity.findMany();
  console.log(res);
})()