require('dotenv/config');
const { PrismaClient } = require('../lib/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...\n');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@leadcrm.com' },
    update: {},
    create: {
      email: 'admin@leadcrm.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user: ${admin.email} / admin123`);

  const memberPassword = await bcrypt.hash('member123', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@leadcrm.com' },
    update: {},
    create: {
      email: 'member@leadcrm.com',
      name: 'Team Member',
      password: memberPassword,
      role: 'MEMBER',
    },
  });
  console.log(`Member user: ${member.email} / member123`);

  const leads = [
    { name: 'Alice Johnson', email: 'alice@techcorp.com', company: 'TechCorp', message: 'Interested in enterprise plan', status: 'NEW' },
    { name: 'Bob Williams', email: 'bob@startup.io', company: 'StartupIO', message: 'Needs a demo next week', status: 'CONTACTED' },
    { name: 'Carol Davis', email: 'carol@bigcorp.com', company: 'BigCorp', message: 'Budget approved, ready to proceed', status: 'QUALIFIED', assignedToId: member.id },
    { name: 'David Lee', email: 'david@smallbiz.com', company: 'SmallBiz', message: null, status: 'PROPOSAL', assignedToId: member.id },
    { name: 'Eva Martinez', email: 'eva@enterprise.com', company: 'Enterprise Inc', message: 'Evaluating competitors', status: 'WON', assignedToId: admin.id },
  ];

  for (const lead of leads) {
    const existing = await prisma.lead.findFirst({ where: { email: lead.email } });
    if (!existing) {
      await prisma.lead.create({ data: lead });
      console.log(`Created lead: ${lead.name}`);
    }
  }

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
