export type PaymentSession = {
  providerId: number; // prisma: id Int @Id - session Id
  createdAt: Date;
  // expires: x
  orderId: string; // equivalent to :[orderId, reservationId] - prisma: @unique
};
// & (
//   | {
//       status: 'pending';
//     }
//   | {
//       status: 'failed';
//       gateway: string;
//     }
//   | {
//       status: 'cancelled';
//       gateway: string;
//     }
//   | {
//       status: 'paid';
//       gateway: string;
//       /**
//        * Reference Id/Number - Transaction Id/Number
//        */
//       transactionId: string;
//     }
// );
