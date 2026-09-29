#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/05d29783aecb91bab15d7618e9753ce8cb07f5f8e890fadd103382c984ccb48d/contract';
import startContract from '../../snapshots/05d29783aecb91bab15d7618e9753ce8cb07f5f8e890fadd103382c984ccb48d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/27a1994a85e5f4a8d57cceace6eca1a9e48d8e21e318e1ad7aed0739548a71f4/contract';
import endContract from '../../snapshots/27a1994a85e5f4a8d57cceace6eca1a9e48d8e21e318e1ad7aed0739548a71f4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'Save', column: 'blacklist' }),
      this.dropDefault({ schema: 'public', table: 'Save', column: 'managers' }),
      this.dropDefault({ schema: 'public', table: 'TempChannel', column: 'blacklist' }),
      this.dropDefault({ schema: 'public', table: 'TempChannel', column: 'managers' }),
      this.dropNotNull({ schema: 'public', table: 'Save', column: 'blacklist' }),
      this.dropNotNull({ schema: 'public', table: 'Save', column: 'managers' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
