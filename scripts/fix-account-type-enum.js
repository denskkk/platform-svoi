const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAccountTypeEnum() {
  console.log('🔧 Виправлення enum AccountType...\n');
  
  try {
    // Виконуємо SQL для додавання значення 'viewer' до enum
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = 'viewer' 
              AND enumtypid = (
                  SELECT oid FROM pg_type WHERE typname = 'AccountType'
              )
          ) THEN
              ALTER TYPE "AccountType" ADD VALUE 'viewer';
              RAISE NOTICE 'Додано значення viewer до enum AccountType';
          ELSE
              RAISE NOTICE 'Значення viewer вже існує в enum AccountType';
          END IF;
      END
      $$;
    `);
    
    console.log('✅ Enum AccountType успішно оновлено!\n');
    
    // Перевірка
    const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AccountType')
      ORDER BY enumsortorder;
    `;
    
    console.log('📋 Поточні значення AccountType:');
    result.forEach(row => console.log(`   - ${row.enumlabel}`));
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccountTypeEnum();
