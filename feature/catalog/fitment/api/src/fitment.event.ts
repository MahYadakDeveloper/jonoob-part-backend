export const FitmentManyDeletedEventType = 'catalog.fitment:fitment-many-deleted';
export const FitmentManyUpdatedEventType = 'catalog.fitment:fitment-many-deleted';

export type FitmentManyDeletedEventPayload = {
  fitmentsIds: string[];
};

export type FitmentManyUpdatedEventPayload = {
  fitmentsIds: string[];
};
