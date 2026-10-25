/**
 * Діагностика входу (тільки читає БД, нічого не змінює).
 *
 * Використання (на сервері, у папці проєкту):
 *   node scripts/check-user.js user@example.com
 *   CHECK_PASSWORD='пароль який вводить людина' node scripts/check-user.js user@example.com
 *
 * Пароль можна не вказувати — тоді перевіряється лише наявність і стан акаунта.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function variants(password) {
  const flipFirst = (value) => {
    const first = value.charAt(0);
    return (first === first.toLowerCase() ? first.toUpperCase() : first.toLowerCase()) + value.slice(1);
  };
  const trimmed = password.trim();
  const list = new Map();
  for (const [label, value] of [
    ['точний', password],
    ['без пробілів по краях', trimmed],
    ['з іншим регістром першої літери', flipFirst(password)],
    ['обидва варіанти', flipFirst(trimmed)],
  ]) {
    if (value && !list.has(value)) list.set(value, label);
  }
  return Array.from(list, ([value, label]) => [label, value]);
}

async function main() {
  const email = (process.argv[2] || '').trim();
  if (!email) {
    console.error('Вкажіть email: node scripts/check-user.js user@example.com');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true, email: true, firstName: true, lastName: true, accountType: true,
      isActive: true, isAdmin: true, createdAt: true, passwordHash: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(`\nПошук: "${email}" (без урахування регістру)`);
  if (users.length === 0) {
    const local = email.split('@')[0];
    const similar = await prisma.user.findMany({
      where: { email: { contains: local.slice(0, Math.max(4, Math.floor(local.length / 2))), mode: 'insensitive' } },
      select: { id: true, email: true, createdAt: true },
      take: 10,
    });
    console.log('❌ Акаунта з таким email НЕМАЄ в базі (його не створено, видалено або email записаний інакше).');
    if (similar.length) {
      console.log('Схожі email у базі:');
      similar.forEach((u) => console.log(`  #${u.id}  ${JSON.stringify(u.email)}  створено ${u.createdAt.toISOString()}`));
    }
    return;
  }

  if (users.length > 1) console.log(`⚠️  Знайдено ${users.length} акаунти з однаковим email у різному регістрі.`);

  const password = process.env.CHECK_PASSWORD;
  for (const u of users) {
    const sessions = await prisma.session.findMany({
      where: { userId: u.id },
      orderBy: { lastActivity: 'desc' },
      take: 3,
      select: { isActive: true, createdAt: true, lastActivity: true, expiresAt: true, userAgent: true },
    });
    const hash = u.passwordHash || '';
    console.log(`\n#${u.id}  ${JSON.stringify(u.email)}  ${u.firstName} ${u.lastName}`);
    console.log(`  тип: ${u.accountType}   активний: ${u.isActive ? 'так' : 'НІ (вхід заблоковано)'}   адмін: ${u.isAdmin ? 'так' : 'ні'}`);
    console.log(`  створено: ${u.createdAt.toISOString()}`);
    console.log(`  хеш пароля: ${/^\$2[aby]\$\d{2}\$/.test(hash) ? 'коректний bcrypt' : 'ПОШКОДЖЕНИЙ/порожній — пароль не підійде ніколи'}`);
    if (sessions.length) {
      console.log('  останні сесії:');
      sessions.forEach((s) => console.log(`    ${s.isActive ? 'активна' : 'завершена'}  остання активність ${s.lastActivity.toISOString()}  до ${s.expiresAt.toISOString()}`));
    } else {
      console.log('  сесій немає (ніколи не входив або сесії видалено)');
    }

    if (password !== undefined && hash) {
      let matched = false;
      for (const [label, value] of variants(password)) {
        if (value && await bcrypt.compare(value, hash)) {
          console.log(`  ✅ пароль ПІДХОДИТЬ (${label})`);
          matched = true;
          break;
        }
      }
      if (!matched) console.log('  ❌ вказаний пароль НЕ підходить (жоден варіант). Людині потрібен новий пароль: scripts/reset-password.js');
    }
  }
}

main()
  .catch((error) => { console.error('Помилка:', error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
