import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cmh = await prisma.hospital.upsert({
    where: { name: "Chiangmai Hospital" },
    update: {},
    create: {
      name: "Chiangmai Hospital",
      shortName: "CMH",
      website: "https://example.com",
    },
  });

  const pkg = await prisma.healthPackage.upsert({
    where: { slug: "cmh-basic-male" },
    update: {},
    create: {
      hospitalId: cmh.id,
      title: "Basic Health Check (Male)",
      slug: "cmh-basic-male",
      basePrice: 1990,
      gender: "male",
      category: ["basic"],
      tags: ["blood", "urine", "chest-xray"],
      status: "APPROVED",
      includes: {
        create: [
          { name: "CBC", groupName: "blood" },
          { name: "FBS", groupName: "blood" },
          { name: "Chest X-ray", groupName: "imaging" },
        ],
      },
    },
  });

  await prisma.priceHistory.create({
    data: { packageId: pkg.id, price: 1990, notes: "seed" },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

