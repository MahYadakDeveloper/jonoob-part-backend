export type VehicleNodeType =
  | "make"
  | "model"
  | "series"
  | "transmission"
  | "fuelType";

export interface VehicleNode {
  id: string;

  type: VehicleNodeType;

  name: string;

  parentId?: string;
}