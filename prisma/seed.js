require('dotenv/config');
const { PrismaClient } = require('../lib/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function generatePassword() {
  return crypto.randomBytes(16).toString('base64url');
}

async function main() {
  console.log('Seeding database...\n');

  // Generate strong random passwords
  const adminPassword = generatePassword();
  const memberPassword = generatePassword();

  const admin = await prisma.user.upsert({
    where: { email: 'admin@leadcrm.com' },
    update: {},
    create: {
      email: 'admin@leadcrm.com',
      name: 'Admin User',
      password: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
    },
  });
  console.log(`Admin user: ${admin.email} / ${adminPassword}`);

  const member = await prisma.user.upsert({
    where: { email: 'member@leadcrm.com' },
    update: {},
    create: {
      email: 'member@leadcrm.com',
      name: 'Team Member',
      password: await bcrypt.hash(memberPassword, 12),
      role: 'MEMBER',
    },
  });
  console.log(`Member user: ${member.email} / ${memberPassword}`);

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
  console.log('\nIMPORTANT: Save these credentials securely!');
  console.log(`Admin: ${admin.email} / ${adminPassword}`);
  console.log(`Member: ${member.email} / ${memberPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
