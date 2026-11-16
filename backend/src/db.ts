import "dotenv/config";

// Check if running in simple mode (no DATABASE_URL)
const isSimpleMode = !process.env.DATABASE_URL || process.env.DATABASE_URL === '';

let db;

if (isSimpleMode) {
  console.log('🚀 Running in SIMPLE MODE (In-Memory Database)');
  
  // In simple mode, db will be set by server-simple.js via global.db
  // We just create a passthrough
  db = {
    get orm() {
      if (!global.db) {
        throw new Error('Database not initialized');
      }
      return global.db.orm;
    }
  };
} else {
  // Normal Prisma mode
  console.log('🗄️ Running in DATABASE MODE (Prisma + PostgreSQL)');
  
  const postgres = (await import('@prisma/orm-postgres/runtime')).default;
  const contractJson = (await import('../../database/prisma/contract.json', { with: { type: 'json' } })).default;
  
  db = postgres({
    contractJson,
    url: process.env.DATABASE_URL,
  });

  await db.connect();
}

export { db };
