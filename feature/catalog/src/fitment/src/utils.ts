import { FitmentNodeDeep, FitmentRootNode } from "./model/fitment";

export function* ancestors(
  node: FitmentNodeDeep,
): Generator<FitmentNodeDeep | FitmentRootNode> {
  let current: FitmentNodeDeep | FitmentRootNode = node;

  while (true) {
    yield current;

    if (current.type === "make") {
      break;
    }

    current = current.parent;
  }
}
