export type SupplyRecordHistory = {
  productId: string;

  records: SupplyRecord[];
};

export type SupplyRecord = {
  suppliedAt: Date;

  supplier?: {
    id: string;
    displayName: string;
  };

  quantity: number;

  unit?: string;

  purchasePrice: {
    amount: number;
    currency: string;
  };

  documentId?: string;
};

// [TODO]
// model SupplyRecordHistory {
//   goodId String @id

//   records SupplyRecordModel[]

//   updatedAt DateTime @updatedAt
// }

// model SupplyRecordModel {
//   history   SupplyRecordHistory @relation(fields: [historyId], references: [goodId], onDelete: Cascade)
//   historyId String

//   suppliedAt DateTime

//   supplierId          String?
//   supplierDisplayName String?

//   quantity Decimal @db.Decimal(18, 4)
//   unit     String?

//   purchasePriceAmount   Decimal @db.Decimal(18, 4)
//   purchasePriceCurrency String

//   documentId String?

//   @@index([historyId, suppliedAt(sort: Desc)])
// }
