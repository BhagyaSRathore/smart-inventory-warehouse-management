import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function run() {
  console.log('Running FCM token schema update via pg...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query('ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "fcmToken" text;');
    console.log('Successfully verified/added column "fcmToken" to "public"."user".');
  } catch (err) {
    console.error('Error adding fcmToken column:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
