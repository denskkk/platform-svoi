/**
 * Grant UCM to all users script
 * Usage (PowerShell):
 *   $env:AMOUNT = 5; $env:DRY_RUN=1; node .\scripts\grant-ucm.js
 *   $env:AMOUNT = 5; node .\scripts\grant-ucm.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AMOUNT = parseFloat(process.env.AMOUNT || '5');
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

async function main() {
  console.log(`Granting ${AMOUNT} уцмок to all users (dryRun=${DRY_RUN})`);

  const users = await prisma.user.findMany({ select: { id: true, email: true, balanceUcm: true } });
  console.log(`Found ${users.length} users`);

  let success = 0;
  let failed = 0;

  for (const u of users) {
    try {
      const current = Number(u.balanceUcm) || 0;
      const delta = Math.max(0, AMOUNT - current);

      if (delta === 0) {
        console.log(`User ${u.id} (${u.email || 'no-email'}) already has >= ${AMOUNT} (has ${current})`);
        success++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[DRY] Would top-up user ${u.id} (${u.email || 'no-email'}) by ${delta} to reach ${AMOUNT} (has ${current})`);
        success++;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: u.id }, data: { balanceUcm: { increment: delta } } });
        await tx.ucmTransaction.create({
          data: {
            userId: u.id,
            kind: 'credit',
            amount: delta,
            reason: 'admin_grant',
            relatedEntityType: null,
            relatedEntityId: null,
            meta: {},
          }
        });
      });

      console.log(`Topped-up user ${u.id} (${u.email || 'no-email'}) by ${delta} to reach ${AMOUNT}`);
      success++;
    } catch (e) {
      failed++;
      console.error(`Failed to top-up user ${u.id}:`, e && e.message ? e.message : e);
    }
  }

  console.log(`Done. success=${success}, failed=${failed}`);
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
