import { City, Province } from './location.type';

export interface FindProvinceByIdResponse {
  province: Province;
}

export interface FindCityByIdResponse {
  city: City;
}

export interface FindManyCityByProvinceResponse {
  cities: City[];
}

export interface ListProvinceResponse {
  provinces: Province[];
}
