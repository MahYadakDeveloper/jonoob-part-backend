import {
  type OutboxRepository,
  type TransactionManager,
} from '@feature/common';
import { type CustomersApi } from '@feature/customer-api';
import {
  RegistrationRequestConfirmedEventPayload,
  RegistrationRequestConfirmedEventType,
  RegistrationRequestRejectedEventPayload,
  RegistrationRequestRejectedEventType,
} from '@feature/customer-registration-api';
import { type DeliveryApi } from '@feature/order-delivery-api';
import { RegistrationRequest } from './registration-request';
import { RegistrationRequestRepository } from './registration-requests.repository';

export class RegistrationRequestsManagement {
  constructor(
    private readonly customers: CustomersApi,
    private readonly delivery: DeliveryApi,
    private readonly repository: RegistrationRequestRepository,
    private readonly outbox: OutboxRepository,
    private readonly tx: TransactionManager,
  ) {}

  async record(req: RegistrationRequest) {
    const { exists } = await this.customers.existsByPhoneNumber({
      phoneNumber: req.phoneNumber,
    });

    if (exists) throw new Error();

    await this.repository.create({
      ...req,
      address: {
        ...req.address,
      },
    });
  }

  list() {
    return this.repository.list();
  }

  confirm({ requestId }: { requestId: string }) {
    return this.repository.findById(requestId).then(async (request) => {
      if (!request) throw new Error();

      await this.tx.run(async () => {
        switch (request.type) {
          case 'merchant':
            await this.customers.createMerchantTypeCustomer(request);
            break;
          case 'technician':
            await this.customers.createTechnicianTypeCustomer(request);
            break;
        }

        await this.outbox.save({
          type: RegistrationRequestConfirmedEventType,
          payload: {
            phoneNumber: request.phoneNumber,
          } satisfies RegistrationRequestConfirmedEventPayload,
        });
      });
    });
  }

  reject({ requestId, message }: { requestId: string; message: string }) {
    return this.repository.findById(requestId).then(async (request) => {
      if (!request) throw new Error();

      // [TODO] Add handler for this in infra/integrations/sms
      await this.tx.run(async () => {
        await this.repository.delete(requestId);

        await this.outbox.save({
          type: RegistrationRequestRejectedEventType,
          payload: {
            phoneNumber: request.phoneNumber,
            message,
          } satisfies RegistrationRequestRejectedEventPayload,
        });
      });
    });
  }
}
