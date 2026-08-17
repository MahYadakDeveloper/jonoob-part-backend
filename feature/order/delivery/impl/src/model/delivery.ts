export type Delivery = {
  orderId: string;
  courier: {
    courierId: string;
    handedOverAt: Date;
  };
};
