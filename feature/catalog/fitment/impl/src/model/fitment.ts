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

export type FitmentRoot = {
  id: string;
  type: 'make';
  name: string;
  logo: MediaRef;
};

export interface FitmentNode {
  id: string;

  type: FitmentNodeType;

  name: string;

  parentId: string;
}

export interface FitmentHierarchy {
  id: string;
  type: FitmentNodeType;
  name: string;
  parent: FitmentHierarchy | FitmentRoot;
}
