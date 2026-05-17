import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const p = await prisma.prediction.findFirst({
    where: { isPrivate: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, placeName: true, raceNumber: true },
});
console.log(JSON.stringify(p, null, 2));
await prisma.$disconnect();
