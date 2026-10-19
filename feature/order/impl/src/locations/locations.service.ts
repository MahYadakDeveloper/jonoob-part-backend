import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { cities, provinces } from '@infra/db-drizzle/schema';
import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { City, Province } from './locations.type';

const LocationSourceSchema = z
  .array(
    z
      .object({
        id: z.number().int().positive(),
        name: z.string().trim().min(1).max(100),
        cities: z.array(
          z
            .object({
              id: z.number().int().positive(),
              name: z.string().trim().min(1).max(100),
            })
            .strict(),
        ),
      })
      .strict(),
  )
  .min(1)
  .superRefine((locations, ctx) => {
    const provinceIds = new Set<number>();
    const cityIds = new Set<number>();

    locations.forEach((province, provinceIndex) => {
      if (provinceIds.has(province.id)) {
        ctx.addIssue({
          code: 'custom',
          path: [provinceIndex, 'id'],
          message: `Duplicate province id: ${province.id}`,
        });
      }
      provinceIds.add(province.id);

      province.cities.forEach((city, cityIndex) => {
        if (cityIds.has(city.id)) {
          ctx.addIssue({
            code: 'custom',
            path: [provinceIndex, 'cities', cityIndex, 'id'],
            message: `Duplicate city id: ${city.id}`,
          });
        }
        cityIds.add(city.id);
      });
    });
  });

type LocationSource = z.infer<typeof LocationSourceSchema>;

@Injectable()
export class LocationsService
  extends DrizzleBaseRepository
  implements OnModuleInit
{
  constructor(
    dbProvider: DrizzleDbProvider,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  async onModuleInit(): Promise<void> {
    const locations = await this.readLocationFile();
    const provinceRows = locations.map(({ id, name }) => ({
      id,
      name: this.normalizeLocationName(name),
    }));
    const cityRows = locations.flatMap(({ id: provinceId, cities: rows }) =>
      rows.map(({ id, name }) => ({
        id,
        name: this.normalizeLocationName(name),
        provinceId,
      })),
    );

    await this.db.transaction(async (tx) => {
      await tx
        .insert(provinces)
        .overridingSystemValue()
        .values(provinceRows)
        .onConflictDoUpdate({
          target: provinces.id,
          set: { name: sql`excluded.name` },
        });

      await tx
        .insert(cities)
        .overridingSystemValue()
        .values(cityRows)
        .onConflictDoUpdate({
          target: cities.id,
          set: {
            name: sql`excluded.name`,
            provinceId: sql`excluded.province_id`,
          },
        });

      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('public.provinces', 'id'),
          (SELECT MAX(${provinces.id}) FROM ${provinces}),
          true
        )
      `);
      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('public.cities', 'id'),
          (SELECT MAX(${cities.id}) FROM ${cities}),
          true
        )
      `);
    });
  }

  async findProvinceById(provinceId: number): Promise<Province> {
    const [province] = await this.db
      .select({ id: provinces.id, name: provinces.name })
      .from(provinces)
      .where(eq(provinces.id, provinceId))
      .limit(1);

    if (!province)
      throw new NotFoundException(`Province not found: ${provinceId}`);

    return province;
  }

  async findCityById(cityId: number): Promise<City> {
    const [city] = await this.db
      .select({
        id: cities.id,
        name: cities.name,
        province: {
          id: provinces.id,
          name: provinces.name,
        },
      })
      .from(cities)
      .innerJoin(provinces, eq(cities.provinceId, provinces.id))
      .where(eq(cities.id, cityId))
      .limit(1);

    if (!city) throw new NotFoundException(`City not found: ${cityId}`);

    return city;
  }

  async listCitiesByProvinceId(provinceId: number): Promise<City[]> {
    return this.db
      .select({
        id: cities.id,
        name: cities.name,
        province: {
          id: provinces.id,
          name: provinces.name,
        },
      })
      .from(cities)
      .innerJoin(provinces, eq(cities.provinceId, provinces.id))
      .where(eq(provinces.id, provinceId))
      .orderBy(asc(cities.id));
  }

  async listProvinces(): Promise<Province[]> {
    return this.db
      .select({ id: provinces.id, name: provinces.name })
      .from(provinces)
      .orderBy(asc(provinces.id));
  }

  private normalizeLocationName(value: string): string {
    return (
      value
        .normalize('NFKC')
        // Arabic letters -> Persian letters
        .replace(/ي/g, 'ی')
        .replace(/ى/g, 'ی')
        .replace(/ك/g, 'ک')

        // Remove Arabic diacritics
        .replace(/[\u064B-\u065F\u0670]/g, '')

        // Persian/Arabic digits -> English digits
        .replace(/[۰-۹]/g, (digit) =>
          String.fromCharCode(digit.charCodeAt(0) - 1728),
        )
        .replace(/[٠-٩]/g, (digit) =>
          String.fromCharCode(digit.charCodeAt(0) - 1584),
        )

        // Normalize whitespace and zero-width chars
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')

        // Trim
        .trim()
        .toLowerCase()
    );
  }

  private async readLocationFile(): Promise<LocationSource> {
    const filePath = resolve(__dirname, '../../data/locations.json');
    const content = await readFile(filePath, 'utf8');
    const json: unknown = JSON.parse(content);

    return LocationSourceSchema.parse(json);
  }
}
