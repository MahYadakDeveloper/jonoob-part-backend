export type ProcurementRequest = {
  /**
   * This would be unique in db and can be used as identifier
   */
  displayName: string;

  quantity?: number;
};
