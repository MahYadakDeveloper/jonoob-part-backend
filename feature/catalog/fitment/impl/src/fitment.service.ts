import { FitmentApi, FitmentDto } from "@feature/fitment-api";
import { FitmentRepository } from "./fitment.repository";
import { ancestors } from "./utils";

export class FitmentService implements FitmentApi {
  constructor(private readonly repository: FitmentRepository) {}

  async fitment(id: string): Promise<FitmentDto> {
    const reference = await this.repository.findReference(id)

    const fitment = await this.repository.findNodeDeep(reference.referenceId)

    let make: {}
    let [model, series, transmission, fuelType]:string[] = []
    for (const node of ancestors(fitment)) {
      switch (node.type) {
        case "make":
          make = node.name
          continue;
      }
    }

    return {

    }
  }

  async createFitment() {}
  async updateFitment() {}

  async deleteFitment() {}

}
