import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

try {
  await client.connect();
  console.log('Connected to database\n');
  
  console.log('Listing all tables in public schema:');
  const result = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  
  console.log('\nFound', result.rows.length, 'tables:');
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.tablename}`);
  });
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await client.end();
}