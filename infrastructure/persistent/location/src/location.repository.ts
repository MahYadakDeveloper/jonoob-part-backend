import { type DbProvider } from '@feature/common';
import {
  FindCityByIdRequest,
  FindCityByIdResponse,
  FindManyCityByProvinceRequest,
  FindManyCityByProvinceResponse,
  FindProvinceByIdRequest,
  FindProvinceByIdResponse,
  ListProvinceResponse,
  LocationApi,
} from '@feature/order-delivery-location-api';
import { BaseRepository } from '@infra/common-persistent';
import { PrismaDbClient } from '@infra/db-prisma';
import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { LocationSource, LocationSourceSchema } from './schema';

@Injectable()
export class LocationRepository extends BaseRepository<PrismaDbClient> implements LocationApi {
  constructor(dbProvider: DbProvider<PrismaDbClient>) {
    super(dbProvider);
  }

  async findProvinceByName({ name }: { name: string }) {
    const province = await this.db.province.findFirstOrThrow({
      where: {
        normalizedName: this.normalizeLocationName(name),
      },
    });

    return {
      province,
    };
  }

  async findProvinceById(req: FindProvinceByIdRequest): Promise<FindProvinceByIdResponse> {
    const province = await this.db.province.findUniqueOrThrow({
      where: {
        id: req.provinceId,
      },
    });

    return {
      province,
    };
  }

  async findCityById(req: FindCityByIdRequest): Promise<FindCityByIdResponse> {
    const city = await this.db.city.findUniqueOrThrow({
      where: {
        id: req.cityId,
      },
      include: {
        province: true,
      },
    });

    return {
      city,
    };
  }

  async findCitiesByProvince(
    req: FindManyCityByProvinceRequest,
  ): Promise<FindManyCityByProvinceResponse> {
    const cities = await this.db.city.findMany({
      where: {
        provinceId: req.provinceId,
      },
      include: {
        province: true,
      },
    });

    return {
      cities: cities,
    };
  }

  async listProvince(): Promise<ListProvinceResponse> {
    const provinces = await this.db.province.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return {
      provinces: provinces,
    };
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
        .replace(/[۰-۹]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 1728))
        .replace(/[٠-٩]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 1584))

        // Normalize whitespace and zero-width chars
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')

        // Trim
        .trim()
        .toLowerCase()
    );
  }

  async initialize(): Promise<void> {
    const locations = await this.readLocationFile();

    await this.dbProvider.transaction(async (tx) => {
      await tx.city.deleteMany();
      await tx.province.deleteMany();

      for (const province of locations) {
        const provinceRecord = await tx.province.create({
          data: {
            sourceId: province.id,
            name: province.name,
            normalizedName: this.normalizeLocationName(province.name),
          },
        });

        await tx.city.createMany({
          data: province.cities.map((city) => ({
            sourceId: city.id,
            name: city.name,
            normalizedName: this.normalizeLocationName(city.name),
            provinceId: provinceRecord.id,
          })),
        });
      }
    });
  }

  private async readLocationFile(): Promise<LocationSource> {
    const filePath = './../data/locations.json';

    const content = await readFile(filePath, 'utf8');

    const json = JSON.parse(content);

    return LocationSourceSchema.parse(json);
  }
}
