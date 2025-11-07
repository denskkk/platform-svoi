/**
 * Clear entire database (JS version)
 * Usage: npm run db:clear
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clear() {
  try {
    console.log('🗑️  Clearing database...');

    const reviews = await prisma.review.deleteMany({});
    const sessions = await prisma.session.deleteMany({});
    const services = await prisma.service.deleteMany({});
    const businessInfo = await prisma.businessInfo.deleteMany({});
    const users = await prisma.user.deleteMany({});

    console.log('✓ Done. Summary:');
    console.log(`  users: ${users.count}`);
    console.log(`  services: ${services.count}`);
    console.log(`  businessInfo: ${businessInfo.count}`);
    console.log(`  reviews: ${reviews.count}`);
    console.log(`  sessions: ${sessions.count}`);
  } catch (e) {
    console.error('❌ Failed to clear DB:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

clear();
