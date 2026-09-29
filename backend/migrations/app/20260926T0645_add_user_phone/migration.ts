#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2888222f6459a2b6098472bf4bdab75998f4ac4d5ee4cb946485e27abb86ec6b/contract';
import endContract from '../../snapshots/2888222f6459a2b6098472bf4bdab75998f4ac4d5ee4cb946485e27abb86ec6b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c2e83454cb89045c22ee74db8df0fcacfa279fc8bd433e128efa353448a3ddb1/contract';
import startContract from '../../snapshots/c2e83454cb89045c22ee74db8df0fcacfa279fc8bd433e128efa353448a3ddb1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
