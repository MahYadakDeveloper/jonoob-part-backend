import { addresses } from '@infra/db-drizzle/schema';

export type CustomerAddress = Omit<
  typeof addresses.$inferSelect,
  'scope' | 'provinceId' | 'postalCode' | 'latitude' | 'longitude'
> &
  (
    | {
        scope: 'inter_city';
        provinceId: number;
        postalCode: string;
      }
    | {
        scope: 'intra_city';
        provinceId: number;
        latitude: number | null;
        longitude: number | null;
      }
  );
