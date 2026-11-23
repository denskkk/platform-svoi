/**
 * Створює (або оновлює) адміністратора для тестів і друкує згенерований пароль.
 * Використання:  node scripts/create-admin.js            (email admin@svoi.local, випадковий пароль)
 *                node scripts/create-admin.js me@mail.com
 * Пароль можна задати: ADMIN_PASSWORD='...' node scripts/create-admin.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || 'admin@svoi.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || `Adm-${crypto.randomBytes(5).toString('hex')}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, isAdmin: true, role: 'admin', isActive: true, email } });
  } else {
    await prisma.user.create({ data: { email, passwordHash, firstName: 'Адміністратор', lastName: 'Платформи', role: 'admin', accountType: 'basic', isAdmin: true, isActive: true, isVerified: true, city: 'Київ' } });
  }
  console.log(`\nАдміністратор готовий:\n  email:  ${email}\n  пароль: ${password}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
