require('dotenv/config');
const { PrismaClient } = require('../lib/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...\n');

  // Admin users
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin01@gmail.com' },
    update: {},
    create: {
      email: 'admin01@gmail.com',
      name: 'Admin User',
      password: await bcrypt.hash('Admin@12345', 12),
      role: 'ADMIN',
    },
  });
  console.log(`Admin created: ${admin1.email}`);

  const admin2 = await prisma.user.upsert({
    where: { email: 'sample001@gmail.com' },
    update: {},
    create: {
      email: 'sample001@gmail.com',
      name: 'Sample Admin',
      password: await bcrypt.hash('test1234', 12),
      role: 'ADMIN',
    },
  });
  console.log(`Admin created: ${admin2.email}`);

  // Member users
  const member1 = await prisma.user.upsert({
    where: { email: 'member@leadcrm.com' },
    update: {},
    create: {
      email: 'member@leadcrm.com',
      name: 'Team Member',
      password: await bcrypt.hash('Member@12345', 12),
      role: 'MEMBER',
    },
  });
  console.log(`Member created: ${member1.email}`);

  const member2 = await prisma.user.upsert({
    where: { email: 'member01@gmail.com' },
    update: {},
    create: {
      email: 'member01@gmail.com',
      name: 'Member 01',
      password: await bcrypt.hash('test1234', 12),
      role: 'MEMBER',
    },
  });
  console.log(`Member created: ${member2.email}`);

  const leads = [
    { name: 'Alice Johnson', email: 'alice@techcorp.com', company: 'TechCorp', message: 'Interested in enterprise plan', status: 'NEW' },
    { name: 'Bob Williams', email: 'bob@startup.io', company: 'StartupIO', message: 'Needs a demo next week', status: 'CONTACTED' },
    { name: 'Carol Davis', email: 'carol@bigcorp.com', company: 'BigCorp', message: 'Budget approved, ready to proceed', status: 'QUALIFIED', assignedToId: member1.id },
    { name: 'David Lee', email: 'david@smallbiz.com', company: 'SmallBiz', message: null, status: 'PROPOSAL', assignedToId: member1.id },
    { name: 'Eva Martinez', email: 'eva@enterprise.com', company: 'Enterprise Inc', message: 'Evaluating competitors', status: 'WON', assignedToId: admin1.id },
  ];

  for (const lead of leads) {
    const existing = await prisma.lead.findFirst({ where: { email: lead.email } });
    if (!existing) {
      await prisma.lead.create({ data: lead });
      console.log(`Created lead: ${lead.name}`);
    }
  }

  console.log('\nSeed complete!');
  console.log('\nAll Credentials:');
  console.log('Admin:   admin01@gmail.com     / Admin@12345');
  console.log('Admin:   sample001@gmail.com   / test1234');
  console.log('Member:  member@leadcrm.com    / Member@12345');
  console.log('Member:  member01@gmail.com    / test1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
