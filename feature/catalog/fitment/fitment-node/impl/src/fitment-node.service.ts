import {
  FindFitmentNodeRequest,
  FindFitmentNodeResponse,
  FindManyFitmentNodeRequest,
  FindManyFitmentNodeResponse,
  FitmentFuelTypeNode,
  FitmentMakeNode,
  FitmentModelNode,
  FitmentNode,
  FitmentNodeApi,
  FitmentNodeDeletedEventPayload,
  FitmentNodeDeletedEventType,
  FitmentNodeUpdatedEventPayload,
  FitmentNodeUpdateEventType,
  FitmentSeriesNode,
  FitmentTransmissionNode,
} from '@feature/catalog.fitment.node-api';
import { type OutboxRepository, type TransactionManager } from '@feature/common';
import { Injectable } from '@nestjs/common';
import {
  FitmentFuelTypeCreationRequest,
  FitmentFuelTypeUpdatingRequest,
  FitmentMakeCreationRequest,
  FitmentMakeUpdatingRequest,
  FitmentModelCreationRequest,
  FitmentModelUpdatingRequest,
  FitmentNodeDeletionRequest,
  FitmentSeriesCreationRequest,
  FitmentSeriesUpdatingRequest,
  FitmentTransmissionCreationRequest,
  FitmentTransmissionUpdatingRequest,
} from './fitment-node.req';
import { FitmentNodeCreationResponse } from './fitment-node.res';
import { BaseFitmentNode, CreateNode, UpdateNode } from './model/fitment-node';
import { type FitmentNodeRepository } from './repository/fitment-node.repository';

@Injectable()
export class FitmentNodeService implements FitmentNodeApi {
  constructor(
    private readonly repository: FitmentNodeRepository,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {}
  async find({ nodeId }: FindFitmentNodeRequest): Promise<FindFitmentNodeResponse> {
    const node = await this.repository.findHierarchyNodeById(nodeId);

    if (!node) throw new Error(`Not found node: ${nodeId}`);

    const fitmentNode = this.toFitmentNode(this.ancestors(node));

    return {
      node: fitmentNode,
    };
  }

  async findMany({ nodeIds }: FindManyFitmentNodeRequest): Promise<FindManyFitmentNodeResponse> {
    const nodes = await this.repository.findManyHierarchyNodesByIds(nodeIds);

    const fitmentNodes = nodes.transform(
      (node) => this.toFitmentNode(this.ancestors(node)),
      (fitmentNode) => fitmentNode.id,
    );

    return {
      nodes: fitmentNodes,
    };
  }

  async createMake({
    name,
    logo,
  }: FitmentMakeCreationRequest): Promise<FitmentNodeCreationResponse> {
    return {
      id: await this.createNode({
        name,
        logo,
        type: 'make',
      }),
    };
  }

  async createModel({
    name,
    image,
    parentId,
  }: FitmentModelCreationRequest): Promise<FitmentNodeCreationResponse> {
    return {
      id: await this.createNode({
        name,
        image,
        parentId,
        type: 'model',
      }),
    };
  }

  async createSeries({
    name,
    parentId,
  }: FitmentSeriesCreationRequest): Promise<FitmentNodeCreationResponse> {
    return {
      id: await this.createNode({
        name,
        parentId,
        type: 'series',
      }),
    };
  }

  async createTransmission({
    name,
    parentId,
  }: FitmentTransmissionCreationRequest): Promise<FitmentNodeCreationResponse> {
    return {
      id: await this.createNode({
        name,
        parentId,
        type: 'transmission',
      }),
    };
  }

  async createFuelType({
    name,
    parentId,
  }: FitmentFuelTypeCreationRequest): Promise<FitmentNodeCreationResponse> {
    return {
      id: await this.createNode({
        name,
        parentId,
        type: 'fuelType',
      }),
    };
  }

  async updateMake({ nodeId, name, logo }: FitmentMakeUpdatingRequest): Promise<void> {
    return this.updateNode(nodeId, {
      name,
      logo,
    });
  }

  async updateModel({ nodeId, name, image, parentId }: FitmentModelUpdatingRequest): Promise<void> {
    return this.updateNode(nodeId, {
      name,
      image,
      parentId,
    });
  }

  async updateSeries({ nodeId, name, parentId }: FitmentSeriesUpdatingRequest): Promise<void> {
    return this.updateNode(nodeId, {
      name,
      parentId,
    });
  }

  async updateTransmission({
    nodeId,
    name,
    parentId,
  }: FitmentTransmissionUpdatingRequest): Promise<void> {
    return this.updateNode(nodeId, {
      name,
      parentId,
    });
  }

  async createNode(input: CreateNode) {
    const node = await this.repository.find({
      where: {
        name: input.name,
        type: input.type,
        parentId: input.type === 'make' ? undefined : input.parentId,
      },
    });

    if (node) {
      throw new Error(`There is already a ${input.type} named '${input.name}'`);
    }

    return this.repository.create(input);
  }

  async updateFuelType({ nodeId, name, parentId }: FitmentFuelTypeUpdatingRequest): Promise<void> {
    return this.updateNode(nodeId, {
      name,
      parentId,
    });
  }

  private async updateNode(nodeId: string, input: UpdateNode): Promise<void> {
    const node = await this.repository.findById(nodeId);

    if (!node) {
      throw new Error(`Not found node ${nodeId}`);
    }

    const dup = await this.repository.find({
      where: {
        name: input.name, // New name, have to be not existed yet!
        type: node.type,
        parentId: node.parent?.id,
      },
    });

    if (node) {
      throw new Error(`There is already a ${node.type} named '${input.name}'`);
    }

    await this.tx.run(async () => {
      await this.repository.update(nodeId, input);

      await this.outbox.save({
        type: FitmentNodeUpdateEventType,
        payload: {
          fitmentNodeId: nodeId,
        } satisfies FitmentNodeUpdatedEventPayload,
      });
    });
  }

  /**
   * [NOTE]
   * Deleting a node performs a cascading deletion.
   * If the node has child nodes, all descendants will be deleted as well.
   */
  async deleteNode({ nodeId }: FitmentNodeDeletionRequest): Promise<void> {
    const descendants = await this.repository.findDescendants(nodeId);
    const { nodes } = await this.findMany({ nodeIds: [...descendants, nodeId] });

    await this.tx.run(async () => {
      await this.repository.deleteMany([...descendants, nodeId]);

      await this.outbox.save({
        type: FitmentNodeDeletedEventType,
        payload: {
          fitmentNodes: nodes,
        } satisfies FitmentNodeDeletedEventPayload,
      });
    });
  }

  private toFitmentNode(node: Generator<BaseFitmentNode, BaseFitmentNode>): FitmentNode {
    const current = node.next().value;

    switch (current.type) {
      case 'make':
        return {
          id: current.id,
          type: 'make',
          name: current.name,
          logo: current.logo!,
        } satisfies FitmentMakeNode;
      case 'model':
        return {
          id: current.id,
          type: 'model',
          name: current.name,
          image: current.image!,
          parent: this.toFitmentNode(node) as FitmentMakeNode,
        } satisfies FitmentModelNode;
      case 'series':
        return {
          id: current.id,
          type: 'series',
          name: current.name,
          parent: this.toFitmentNode(node) as FitmentModelNode,
        } satisfies FitmentSeriesNode;
      case 'transmission':
        return {
          id: current.id,
          type: 'transmission',
          name: current.name,
          parent: this.toFitmentNode(node) as FitmentModelNode | FitmentSeriesNode,
        } satisfies FitmentTransmissionNode;
      case 'fuelType':
        return {
          id: current.id,
          type: 'fuelType',
          name: current.name,
          parent: this.toFitmentNode(node) as
            FitmentModelNode | FitmentSeriesNode | FitmentTransmissionNode,
        } satisfies FitmentFuelTypeNode;
    }
  }

  private *ancestors(node: BaseFitmentNode): Generator<BaseFitmentNode, BaseFitmentNode> {
    while (node.type !== 'make') {
      yield node;
      node = node.parent!;
    }

    return node;
  }
}
