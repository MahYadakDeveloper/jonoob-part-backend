export interface FitmentReference {
  id: string;

  referenceId: string;

  madeModel?: Date;
}

export type FitmentNodeType = "model" | "series" | "transmission" | "fuelType";

export type FitmentRootNode = {
  id: string;
  type: "make";
  name: string;
  logo: MediaRef;
};

export interface FitmentNode {
  id: string;

  type: FitmentNodeType;

  name: string;

  parentId: string;
}

export interface FitmentNodeDeep {
  id: string;
  type: FitmentNodeType;
  name: string;
  parent: FitmentNodeDeep | FitmentRootNode;
}
