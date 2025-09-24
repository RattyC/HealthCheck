import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertHospital(name, shortName, website) {
  return prisma.hospital.upsert({
    where: { name },
    update: {},
    create: { name, shortName, website },
  });
}

async function upsertPackage(hospitalId, data) {
  const created = await prisma.healthPackage.upsert({
    where: { slug: data.slug },
    update: {
      title: data.title,
      description: data.description ?? null,
      basePrice: data.basePrice,
      priceNote: data.priceNote ?? null,
      gender: data.gender ?? 'any',
      minAge: data.minAge ?? null,
      maxAge: data.maxAge ?? null,
      category: data.category ?? [],
      tags: data.tags ?? [],
      status: data.status ?? 'APPROVED',
      sourceUrl: data.sourceUrl ?? null,
      validFrom: data.validFrom ?? null,
      validTo: data.validTo ?? null,
      lastChecked: new Date(),
    },
    create: {
      hospitalId,
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      basePrice: data.basePrice,
      priceNote: data.priceNote ?? null,
      gender: data.gender ?? 'any',
      minAge: data.minAge ?? null,
      maxAge: data.maxAge ?? null,
      category: data.category ?? [],
      tags: data.tags ?? [],
      status: data.status ?? 'APPROVED',
      sourceUrl: data.sourceUrl ?? null,
      validFrom: data.validFrom ?? null,
      validTo: data.validTo ?? null,
      lastChecked: new Date(),
      includes: { create: (data.includes ?? []).map(i => ({ name: i.name, groupName: i.groupName ?? null, isOptional: !!i.isOptional })) },
    },
  });
  if (data.priceHistory && data.priceHistory.length) {
    for (const ph of data.priceHistory) {
      await prisma.priceHistory.create({ data: { packageId: created.id, price: ph.price, recordedAt: ph.recordedAt ?? new Date(), notes: ph.notes ?? null } });
    }
  } else {
    await prisma.priceHistory.create({ data: { packageId: created.id, price: data.basePrice, notes: 'seed' } });
  }
  return created;
}

async function main() {
  // Hospitals
  const cmh = await upsertHospital('Chiangmai Hospital', 'CMH', 'https://example.com/cmh');
  const sriphat = await upsertHospital('Sriphat Medical Center', 'SRIPHAT', 'https://www.sriphat.com');
  const ram = await upsertHospital('Chiangmai Ram Hospital', 'CM Ram', 'https://www.chiangmairam.com');

  // CMH packages
  await upsertPackage(cmh.id, {
    title: 'Basic Health Check (Male)',
    slug: 'cmh-basic-male',
    basePrice: 1990,
    gender: 'male',
    category: ['basic'],
    tags: ['blood', 'urine', 'chest-xray'],
    status: 'APPROVED',
    includes: [
      { name: 'CBC', groupName: 'blood' },
      { name: 'FBS', groupName: 'blood' },
      { name: 'Chest X-ray', groupName: 'imaging' },
      { name: 'Urinalysis', groupName: 'urine' },
    ],
    priceHistory: [
      { price: 1990, notes: 'seed' },
      { price: 2090, notes: 'promo ended', recordedAt: new Date(Date.now() - 1000*60*60*24*30) },
    ],
  });

  await upsertPackage(cmh.id, {
    title: 'Basic Health Check (Female)',
    slug: 'cmh-basic-female',
    basePrice: 2090,
    gender: 'female',
    category: ['basic'],
    tags: ['blood', 'urine', 'chest-xray'],
    status: 'APPROVED',
    includes: [
      { name: 'CBC', groupName: 'blood' },
      { name: 'FBS', groupName: 'blood' },
      { name: 'Chest X-ray', groupName: 'imaging' },
      { name: 'Urinalysis', groupName: 'urine' },
    ],
  });

  await upsertPackage(cmh.id, {
    title: 'Executive Checkup',
    slug: 'cmh-executive',
    basePrice: 7990,
    gender: 'any',
    category: ['executive'],
    tags: ['blood','imaging','cardiac','ultrasound'],
    status: 'DRAFT',
    includes: [
      { name: 'CBC', groupName: 'blood' },
      { name: 'Lipid profile', groupName: 'blood' },
      { name: 'LFT', groupName: 'blood' },
      { name: 'Chest X-ray', groupName: 'imaging' },
      { name: 'Ultrasound whole abdomen', groupName: 'imaging' },
      { name: 'ECG', groupName: 'cardiac' },
      { name: 'ECHO (optional)', groupName: 'cardiac', isOptional: true },
    ],
  });

  // Sriphat packages
  await upsertPackage(sriphat.id, {
    title: 'Heart Screening',
    slug: 'sriphat-heart',
    basePrice: 3490,
    gender: 'any',
    category: ['cardiac'],
    tags: ['ecg','echo','chest-xray'],
    status: 'APPROVED',
    includes: [
      { name: 'ECG', groupName: 'cardiac' },
      { name: 'ECHO', groupName: 'cardiac' },
      { name: 'Chest X-ray', groupName: 'imaging' },
    ],
  });

  await upsertPackage(sriphat.id, {
    title: 'Pre-op Check (General)',
    slug: 'sriphat-preop',
    basePrice: 2590,
    gender: 'any',
    category: ['pre-op'],
    tags: ['cbc','fbs','ua','xray','ekg'],
    status: 'APPROVED',
    includes: [
      { name: 'CBC', groupName: 'blood' },
      { name: 'FBS', groupName: 'blood' },
      { name: 'Urinalysis', groupName: 'urine' },
      { name: 'Chest X-ray', groupName: 'imaging' },
      { name: 'EKG', groupName: 'cardiac' },
    ],
  });

  // RAM packages
  await upsertPackage(ram.id, {
    title: 'Premium Health Check',
    slug: 'ram-premium',
    basePrice: 5990,
    gender: 'any',
    category: ['premium'],
    tags: ['blood','urine','imaging'],
    status: 'APPROVED',
    includes: [
      { name: 'CBC', groupName: 'blood' },
      { name: 'FBS', groupName: 'blood' },
      { name: 'Lipid profile', groupName: 'blood' },
      { name: 'Urinalysis', groupName: 'urine' },
      { name: 'Chest X-ray', groupName: 'imaging' },
      { name: 'Abdominal Ultrasound', groupName: 'imaging' },
    ],
  });

  await upsertPackage(ram.id, {
    title: 'Senior Checkup (60+)',
    slug: 'ram-senior',
    basePrice: 4290,
    gender: 'any',
    minAge: 60,
    category: ['senior'],
    tags: ['blood','urine','bone'],
    status: 'ARCHIVED',
    includes: [
      { name: 'CBC', groupName: 'blood' },
      { name: 'Creatinine', groupName: 'blood' },
      { name: 'Urinalysis', groupName: 'urine' },
      { name: 'Bone density (DXA)', groupName: 'bone' },
    ],
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
