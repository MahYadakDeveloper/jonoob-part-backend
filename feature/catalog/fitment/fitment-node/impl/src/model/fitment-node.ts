import {
  FitmentFuelTypeNode,
  FitmentMakeNode,
  FitmentModelNode,
  FitmentSeriesNode,
  FitmentTransmissionNode,
} from '@feature/catalog.fitment.node-api';
import { RequiredBy } from '@feature/common';
import { MediaRef } from '@feature/media-api';

export type FitmentNodeType = 'make' | 'model' | 'series' | 'transmission' | 'fuelType';

export type BaseFitmentNode = RequiredBy<
  Partial<
    Omit<FitmentMakeNode, 'type' | 'parent'> &
      Omit<FitmentModelNode, 'type' | 'parent'> &
      Omit<FitmentSeriesNode, 'type' | 'parent'> &
      Omit<FitmentTransmissionNode, 'type' | 'parent'> &
      Omit<FitmentFuelTypeNode, 'type' | 'parent'>
  >,
  'id' | 'name'
> & { type: FitmentNodeType; parent?: BaseFitmentNode };

export type CreateNode =
  | {
      type: 'make';
      name: string;
      logo: MediaRef;
    }
  | {
      type: Exclude<FitmentNodeType, 'make'>;
      name: string;
      parentId: string;
      image?: MediaRef;
    };

export type UpdateNode =
  | {
      name?: string;
      logo?: MediaRef;
    }
  | {
      name?: string;
      image?: MediaRef;
      parentId?: string;
    };
