import "dotenv/config";
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../../database/prisma/contract.d';
import contractJson from '../../database/prisma/contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});

await db.connect();

