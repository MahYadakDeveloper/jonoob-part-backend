import { LineItems } from '@feature/common';
import { City, Province } from './location.type';

export interface FindProvinceByIdResponse {
  province: Province;
}

export interface FindCityByIdResponse {
  city: City;
}

export interface FindManyCityByProvinceResponse {
  cities: LineItems<City>;
}

export interface ListProvinceResponse {
  provinces: LineItems<Province>;
}
