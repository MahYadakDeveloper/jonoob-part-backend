import { MediaRef } from '@feature/common';

export interface Fitment {
  id: string;

  nodeReference: string;

  modelYearRange?: {
    from?: number;
    to?: number;
  };
}

export type FitmentNodeType = 'model' | 'series' | 'transmission' | 'fuelType';

export type FitmentRootNode = {
  id: string;
  type: 'make';
  name: string;
  logo: MediaRef;
};

export interface FitmentHierarchyNode {
  id: string;

  type: FitmentNodeType;

  name: string;

  parent: FitmentHierarchyNode | FitmentRootNode;
}

