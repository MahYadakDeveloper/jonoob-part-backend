import { MediaRef } from '@feature/media-api';

export type FitmentMakeNode = {
  id: string;
  type: 'make';
  name: string;
  logo: MediaRef;
};

export type FitmentModelNode = {
  id: string;
  type: 'model';
  name: string;
  image: MediaRef;
  parent: FitmentMakeNode;
};

export interface FitmentSeriesNode {
  id: string;
  type: 'series';
  name: string;
  parent: FitmentModelNode;
}

export interface FitmentTransmissionNode {
  id: string;
  type: 'transmission';
  name: string;
  parent: FitmentSeriesNode | FitmentModelNode;
}

export interface FitmentFuelTypeNode {
  id: string;
  type: 'fuelType';
  name: string;
  parent: FitmentSeriesNode | FitmentModelNode | FitmentTransmissionNode;
}

export type FitmentNode =
  | FitmentMakeNode
  | FitmentModelNode
  | FitmentSeriesNode
  | FitmentTransmissionNode
  | FitmentFuelTypeNode;
