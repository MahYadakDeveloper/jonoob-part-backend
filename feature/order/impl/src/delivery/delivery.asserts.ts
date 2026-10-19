import { UnprocessableEntityException } from '@nestjs/common';
import { DeliveryAttemptReportDto } from './delivery.schema';

export function assertReportAllowedForScope(
  scope: 'intra_city' | 'inter_city',
  report: DeliveryAttemptReportDto,
): void {
  switch (report.outcome) {
    case 'failed': {
      if (scope === 'inter_city' && report.reason !== 'other') {
        throw new UnprocessableEntityException(
          'Inter-city failure reports only support the "other" reason',
        );
      }
      return;
    }

    case 'delivered': {
      const hasCode = !!report.confirmationCode;
      const hasTracking = !!report.trackingNumber;

      if (scope === 'intra_city' && !hasCode) {
        throw new UnprocessableEntityException(
          'Intra-city delivery requires a confirmation code',
        );
      }
      if (scope === 'inter_city' && !hasTracking) {
        throw new UnprocessableEntityException(
          'Inter-city delivery requires a tracking number',
        );
      }
      return;
    }

    default: {
      const _exhaustive: never = report;
      throw new Error(`Unhandled report: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
