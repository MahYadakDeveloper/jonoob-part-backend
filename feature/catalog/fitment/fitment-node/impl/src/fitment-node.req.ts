import { ImageRef, LogoRef } from '@feature/media-api';

export interface FitmentMakeCreationRequest {
  name: string;
  logo: LogoRef;
}
export interface FitmentMakeUpdatingRequest {
  nodeId: string;
  name: string;
  logo: LogoRef;
}

export interface FitmentModelCreationRequest {
  name: string;
  image: ImageRef;
  parentId: string;
}

export interface FitmentModelUpdatingRequest {
  nodeId: string;
  name: string;
  image: ImageRef;
  parentId: string;
}

export interface FitmentSeriesCreationRequest {
  name: string;
  parentId: string;
}

export interface FitmentSeriesUpdatingRequest {
  nodeId: string;
  name: string;
  parentId: string;
}

export interface FitmentTransmissionCreationRequest {
  name: string;
  parentId: string;
}

export interface FitmentTransmissionUpdatingRequest {
  nodeId: string;
  name: string;
  parentId: string;
}

export interface FitmentFuelTypeCreationRequest {
  name: string;
  parentId: string;
}

export interface FitmentFuelTypeUpdatingRequest {
  nodeId: string;
  name: string;
  parentId: string;
}

export interface FitmentNodeDeletionRequest {
  nodeId: string;
  parentId: string;
}
