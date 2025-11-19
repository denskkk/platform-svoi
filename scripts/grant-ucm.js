/**
 * Grant UCM to all users script
 * Usage (PowerShell):
 *   $env:AMOUNT = 5; $env:DRY_RUN=1; node .\scripts\grant-ucm.js
 *   $env:AMOUNT = 5; node .\scripts\grant-ucm.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const AMOUNT = parseFloat(process.env.AMOUNT || '5');
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

async function main() {
  console.log(`Granting ${AMOUNT} уцмок to all users (dryRun=${DRY_RUN})`);

  const users = await prisma.user.findMany({ select: { id: true, email: true, balanceUcm: true } });
  console.log(`Found ${users.length} users`);

  // Check whether ledger table exists. If it doesn't, we'll skip creating ucmTransaction rows
  // to avoid Prisma P2021 errors on databases where migrations haven't been applied yet.
  const tableCheck = await prisma.$queryRaw`SELECT to_regclass('public.ucm_transactions') as reg`;
  const hasUcmTransactions = Array.isArray(tableCheck) && tableCheck[0] && tableCheck[0].reg !== null;
  console.log('ucm_transactions table present:', hasUcmTransactions);

  const appliedChanges = [];

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

      if (hasUcmTransactions) {
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
      } else {
        // Ledger table missing — update balance only and record change to JSON for later reconciliation
        await prisma.user.update({ where: { id: u.id }, data: { balanceUcm: { increment: delta } } });
        appliedChanges.push({
          userId: u.id,
          email: u.email || null,
          previous: current,
          delta,
          new: current + delta,
          note: 'ucm_transactions_missing_no_ledger_created'
        });
        console.log(`Topped-up (no ledger) user ${u.id} (${u.email || 'no-email'}) by ${delta} to reach ${AMOUNT}`);
        success++;
      }
    } catch (e) {
      failed++;
      console.error(`Failed to top-up user ${u.id}:`, e && e.message ? e.message : e);
    }
  }

  console.log(`Done. success=${success}, failed=${failed}`);

  // If we applied changes but couldn't create ledger rows, persist a log for reconciliation
  if (appliedChanges.length > 0) {
    try {
      const out = {
        timestamp: new Date().toISOString(),
        amountTarget: AMOUNT,
        dryRun: DRY_RUN,
        changes: appliedChanges,
      };
      const outPath = path.join(__dirname, 'grant-ucm-applied.json');
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2), { encoding: 'utf8' });
      console.log(`Wrote applied changes without ledger to ${outPath}`);
    } catch (e) {
      console.warn('Failed to write reconciliation file:', e && e.message ? e.message : e);
    }
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
