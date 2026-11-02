// // DDL constants only, never user input.
// const lit = (s: string) => sql.raw(`'${s.replaceAll("'", "''")}'`);

// export const barcodeType = warehouseSchema.enum('barcode_type', BARCODE_TYPES);

// export const barcodes = warehouseSchema.table(
//   'barcodes',
//   {
//     stockId: uuid('stock_id')
//       .references(() => stocks.id, { onDelete: 'cascade' })
//       .notNull(),
//     type: barcodeType('type').notNull(),
//     rawValue: text('raw_value').notNull(), // the only written column
//     value: text('value') // canonical, derived
//       .notNull()
//       .generatedAlwaysAs(
//         sql`CASE WHEN type = ${lit(CASE_SENSITIVE_TYPE)} THEN btrim(raw_value) ELSE upper(btrim(raw_value)) END`,
//       ),
//   },
//   (t) => [
//     primaryKey({
//       name: STOCK_CONSTRAINTS.barcodePk,
//       columns: [t.type, t.value],
//     }),
//     index('barcodes_product_id_idx').on(t.stockId),
//     check(
//       STOCK_CONSTRAINTS.barcodeValueFormat,
//       sql`CASE ${t.type} ${sql.join(
//         Object.entries(BARCODE_PATTERNS).map(
//           ([type, pattern]) =>
//             sql`WHEN ${lit(type)} THEN ${t.value} ~ ${lit(pattern)}`,
//         ),
//         sql` `,
//       )} ELSE false END`,
//     ),
//   ],
// );
