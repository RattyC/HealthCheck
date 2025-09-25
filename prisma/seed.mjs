import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const editorPassword = await bcrypt.hash('editor1234', 10);
  const userPassword = await bcrypt.hash('user1234', 10);

  const [admin, editor, demoUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@healthcheck.local' },
      update: { name: 'Admin', role: 'ADMIN', passwordHash: adminPassword },
      create: { email: 'admin@healthcheck.local', name: 'Admin', role: 'ADMIN', passwordHash: adminPassword },
    }),
    prisma.user.upsert({
      where: { email: 'editor@healthcheck.local' },
      update: { name: 'Editor', role: 'EDITOR', passwordHash: editorPassword },
      create: { email: 'editor@healthcheck.local', name: 'Editor', role: 'EDITOR', passwordHash: editorPassword },
    }),
    prisma.user.upsert({
      where: { email: 'user@healthcheck.local' },
      update: { name: 'Demo User', role: 'USER', passwordHash: userPassword },
      create: { email: 'user@healthcheck.local', name: 'Demo User', role: 'USER', passwordHash: userPassword },
    }),
  ]);

  // Hospitals
  const cmh = await upsertHospital('Chiangmai Hospital', 'CMH', 'https://example.com/cmh');
  const sriphat = await upsertHospital('Sriphat Medical Center', 'SRIPHAT', 'https://www.sriphat.com');
  const ram = await upsertHospital('Chiangmai Ram Hospital', 'CM Ram', 'https://www.chiangmairam.com');

  // CMH packages
  const pkgCmhMale = await upsertPackage(cmh.id, {
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

  const pkgCmhFemale = await upsertPackage(cmh.id, {
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

  const pkgCmhExecutive = await upsertPackage(cmh.id, {
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
  const pkgHeart = await upsertPackage(sriphat.id, {
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

  const pkgPreop = await upsertPackage(sriphat.id, {
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
  const pkgRamPremium = await upsertPackage(ram.id, {
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

  const pkgRamSenior = await upsertPackage(ram.id, {
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
  const packages = [pkgCmhMale, pkgCmhFemale, pkgCmhExecutive, pkgHeart, pkgPreop, pkgRamPremium, pkgRamSenior].filter(Boolean);

  for (const pkg of packages) {
    await prisma.packageMetric.upsert({
      where: { packageId: pkg.id },
      update: {},
      create: { packageId: pkg.id, viewCount: Math.floor(Math.random() * 100) + 10, compareCount: Math.floor(Math.random() * 40), bookmarkCount: Math.floor(Math.random() * 25) },
    });
  }

  await prisma.savedSearch.createMany({
    data: [
      {
        userId: demoUser.id,
        name: 'Cardio Under 4000',
        params: { q: 'หัวใจ', maxPrice: 4000, category: 'cardiac' },
      },
      {
        userId: demoUser.id,
        name: 'Female Basic',
        params: { gender: 'female', category: 'basic' },
      },
    ],
    skipDuplicates: true,
  });

  await prisma.compareSnapshot.createMany({
    data: [
      {
        slug: 'demo-bundle',
        packageIds: [pkgCmhMale.id, pkgHeart.id],
        userId: demoUser.id,
      },
      {
        slug: 'executive-vs-premium',
        packageIds: [pkgCmhExecutive.id, pkgRamPremium.id],
        userId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.searchLog.createMany({
    data: [
      { userId: demoUser.id, filters: { q: 'basic', maxPrice: 3000 }, results: 3 },
      { userId: demoUser.id, filters: { hospitalId: cmh.id }, results: 4 },
      { userId: admin.id, filters: { status: 'DRAFT' }, results: 1 },
    ],
  });

  await prisma.systemLog.create({
    data: { level: 'INFO', message: 'Seed completed', context: { packages: packages.length } },
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
