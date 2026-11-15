import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

try {
  await client.connect();
  console.log('✅ Connected to database\n');
  
  // Check if app_user table exists
  console.log('Checking for app_user table:');
  const tableCheck = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'app_user';
  `);
  
  if (tableCheck.rows.length === 0) {
    console.log('❌ app_user table does NOT exist!');
    console.log('\nYou need to run the supabase-schema.sql file in Supabase SQL Editor!\n');
  } else {
    console.log('✅ app_user table exists\n');
    
    // Check columns in app_user table
    console.log('Checking columns in app_user table:');
    const columnsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'app_user'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in app_user table:');
    columnsCheck.rows.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log();
    
    // Check for admin user
    console.log('Checking for admin user:');
    const userCheck = await client.query(`
      SELECT * 
      FROM app_user 
      WHERE email = 'admin@inventory.com';
    `);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Admin user does NOT exist!');
      console.log('\nYou need to run the supabase-seed.sql file in Supabase SQL Editor!\n');
    } else {
      const admin = userCheck.rows[0];
      console.log('✅ Admin user exists:');
      console.log('   ID:', admin.id);
      console.log('   Email:', admin.email);
      console.log('   Username:', admin.username);
      console.log('   Role:', admin.role);
      
      // Check password hash with various possible column names
      const passwordHash = admin.password_hash || admin.passwordHash || admin.passwordhash;
      console.log('   Password Hash:', passwordHash ? 'EXISTS (length: ' + passwordHash.length + ')' : 'MISSING!');
      
      if (passwordHash) {
        console.log('\n✅ Database is ready! Login should work.\n');
      } else {
        console.log('\n❌ Password hash is missing! Need to re-run supabase-seed.sql\n');
      }
    }
  }
  
  // List all tables
  console.log('All tables in public schema:');
  const allTables = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  
  console.log('Found', allTables.rows.length, 'tables:');
  allTables.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.tablename}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full error:', error);
} finally {
  await client.end();
}