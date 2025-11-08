const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Use production database URL
const DATABASE_URL = 'postgresql://admin:admin123@45.130.43.116:5432/sviydliasvoyikh';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function runMigration() {
  try {
    console.log('📝 Running migration on production database...');

    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '002_add_extended_profile_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by statements (separated by semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await prisma.$executeRawUnsafe(statement);
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
