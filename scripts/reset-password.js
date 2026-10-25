/**
 * Скидання пароля користувача (адміністратором, на сервері).
 *
 * Використання:
 *   NEW_PASSWORD='НовийПароль123' node scripts/reset-password.js user@example.com
 *   NEW_PASSWORD='НовийПароль123' node scripts/reset-password.js user@example.com --activate
 *
 * Що робить: ставить новий пароль, завершує старі сесії і приводить email до нижнього регістру.
 * --activate додатково знімає блокування (isActive = true).
 * Якщо за email знайдено кілька акаунтів, нічого не змінює — вкажіть точний email.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || '').trim();
  const activate = process.argv.includes('--activate');
  const newPassword = process.env.NEW_PASSWORD;

  if (!email || !newPassword) {
    console.error("Використання: NEW_PASSWORD='пароль' node scripts/reset-password.js user@example.com [--activate]");
    process.exit(1);
  }
  if (newPassword.length < 6) {
    console.error('Пароль має містити мінімум 6 символів.');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true },
  });
  if (users.length === 0) {
    console.error(`Акаунт ${email} не знайдено. Спершу: node scripts/check-user.js ${email}`);
    process.exit(1);
  }
  if (users.length > 1) {
    console.error('Знайдено кілька акаунтів:', users.map((u) => `#${u.id} ${u.email}`).join(', '));
    console.error('Нічого не змінено. Розберіться з дублями вручну.');
    process.exit(1);
  }

  const [user] = users;
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        email: user.email.trim().toLowerCase(),
        ...(activate ? { isActive: true } : {}),
      },
    }),
    prisma.session.updateMany({ where: { userId: user.id }, data: { isActive: false } }),
  ]);

  console.log(`✅ Пароль для #${user.id} (${user.email.trim().toLowerCase()}) змінено, старі сесії завершено.${activate ? ' Акаунт активовано.' : ''}`);
}

main()
  .catch((error) => { console.error('Помилка:', error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
