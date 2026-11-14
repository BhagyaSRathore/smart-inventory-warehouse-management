#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2888222f6459a2b6098472bf4bdab75998f4ac4d5ee4cb946485e27abb86ec6b/contract';
import startContract from '../../snapshots/2888222f6459a2b6098472bf4bdab75998f4ac4d5ee4cb946485e27abb86ec6b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/3d7e4f45636bd615a0a07c65091d62038daf3e652eaf2e18c38a9dafda89aeda/contract';
import endContract from '../../snapshots/3d7e4f45636bd615a0a07c65091d62038daf3e652eaf2e18c38a9dafda89aeda/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'customer',
        columns: [
          col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'notification',
        columns: [
          col('actionUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('read', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('severity', 'text', {
            notNull: true,
            default: lit('INFO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', {
            notNull: true,
            default: lit('SYSTEM_ALERT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('userId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'purchaseOrder',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orderNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subtotal', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('supplierId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tax', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('total', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('warehouseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'purchaseOrderItem',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('productId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('purchaseOrderId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('total', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('unitPrice', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'salesOrder',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('customerId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orderNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subtotal', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('tax', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('total', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('warehouseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'salesOrderItem',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('productId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('salesOrderId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('total', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('unitPrice', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('fcmToken', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'purchaseOrder',
        constraint: 'purchaseOrder_orderNumber_key',
        columns: ['orderNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'salesOrder',
        constraint: 'salesOrder_orderNumber_key',
        columns: ['orderNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'notification',
        index: 'notification_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrder',
        index: 'purchaseOrder_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrder',
        index: 'purchaseOrder_orderNumber_idx_977fd68d',
        columns: ['orderNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrder',
        index: 'purchaseOrder_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrder',
        index: 'purchaseOrder_supplierId_idx_c4d9a8b9',
        columns: ['supplierId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrder',
        index: 'purchaseOrder_warehouseId_idx_8ff93e70',
        columns: ['warehouseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrderItem',
        index: 'purchaseOrderItem_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'purchaseOrderItem',
        index: 'purchaseOrderItem_purchaseOrderId_idx_3e3a8c45',
        columns: ['purchaseOrderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salesOrder',
        index: 'salesOrder_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salesOrder',
        index: 'salesOrder_customerId_idx_b2a8a46c',
        columns: ['customerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salesOrder',
        index: 'salesOrder_orderNumber_idx_977fd68d',
        columns: ['orderNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salesOrder',
        index: 'salesOrder_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salesOrder',
        index: 'salesOrder_warehouseId_idx_8ff93e70',
        columns: ['warehouseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salesOrderItem',
        index: 'salesOrderItem_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'salesOrderItem',
        index: 'salesOrderItem_salesOrderId_idx_0f1a116c',
        columns: ['salesOrderId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'notification',
        foreignKey: {
          name: 'notification_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchaseOrder',
        foreignKey: {
          name: 'purchaseOrder_supplierId_fkey',
          columns: ['supplierId'],
          references: { schema: 'public', table: 'supplier', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchaseOrder',
        foreignKey: {
          name: 'purchaseOrder_warehouseId_fkey',
          columns: ['warehouseId'],
          references: { schema: 'public', table: 'warehouse', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchaseOrderItem',
        foreignKey: {
          name: 'purchaseOrderItem_purchaseOrderId_fkey',
          columns: ['purchaseOrderId'],
          references: { schema: 'public', table: 'purchaseOrder', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'purchaseOrderItem',
        foreignKey: {
          name: 'purchaseOrderItem_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'product', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'salesOrder',
        foreignKey: {
          name: 'salesOrder_customerId_fkey',
          columns: ['customerId'],
          references: { schema: 'public', table: 'customer', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'salesOrder',
        foreignKey: {
          name: 'salesOrder_warehouseId_fkey',
          columns: ['warehouseId'],
          references: { schema: 'public', table: 'warehouse', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'salesOrderItem',
        foreignKey: {
          name: 'salesOrderItem_salesOrderId_fkey',
          columns: ['salesOrderId'],
          references: { schema: 'public', table: 'salesOrder', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'salesOrderItem',
        foreignKey: {
          name: 'salesOrderItem_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'product', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
