import { db } from './src/db.ts';
import { readFileSync } from 'fs';

async function applySchemaFix() {
  try {
    console.log('Reading SQL fix file...');
    const sql = readFileSync('./fix-orders-schema.sql', 'utf-8');
    
    console.log('Applying schema fixes...');
    await db.sql`${sql}`;
    
    console.log('✅ Schema fixes applied successfully!');
    console.log('Created tables: PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem, Customer');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying schema fix:', error);
    process.exit(1);
  }
}

applySchemaFix();
