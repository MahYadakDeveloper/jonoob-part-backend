import {
  GrantCashbackRequest,
  GrantCashbackResponse,
  ICashbackService,
} from "@feature/cashback-api";

export class CashbackService implements ICashbackService {
  constructor() {}

  // TODO Complete this api
  grantCashback(req: GrantCashbackRequest): Promise<GrantCashbackResponse> {
    throw new Error("Method not implemented.");
  }
}
