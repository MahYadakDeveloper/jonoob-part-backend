import { FitmentHierarchyNode, FitmentRootNode } from './model/fitment';

export function* ancestors(
  node: FitmentHierarchyNode,
): Generator<FitmentHierarchyNode | FitmentRootNode> {
  let current: FitmentHierarchyNode | FitmentRootNode = node;

  while (true) {
    yield current;

    if (current.type === 'make') {
      break;
    }

    current = current.parent;
  }
}
