#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/05d29783aecb91bab15d7618e9753ce8cb07f5f8e890fadd103382c984ccb48d/contract';
import endContract from '../../snapshots/05d29783aecb91bab15d7618e9753ce8cb07f5f8e890fadd103382c984ccb48d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Save',
        columns: [
          col('bitrate', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('blacklist', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('closed', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('managers', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('memberLimit', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requestsEnabled', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('slotNum', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'Save_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'ServerSettings',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('language', 'text', {
            notNull: true,
            default: lit('en'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('template', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('voiceCategory', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('voiceChannel', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'ServerSettings_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'TempChannel',
        columns: [
          col('blacklist', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('closed', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('currentSlot', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('managers', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('maxMembers', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('messageId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requests', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'TempChannel_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'UserSettings',
        columns: [col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } })],
        constraints: [primaryKey(['userId'], { name: 'UserSettings_pkey' })],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Save',
        index: 'Save_userId_idx',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Save',
        index: 'Save_userId_slotNum_key',
        columns: ['userId', 'slotNum'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Save',
        foreignKey: {
          name: 'Save_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'UserSettings', columns: ['userId'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
