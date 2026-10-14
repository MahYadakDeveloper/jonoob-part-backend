import {
  FindCityByIdRequest,
  FindManyCityByProvinceRequest,
  FindProvinceByIdRequest,
} from './location.req';
import {
  FindCityByIdResponse,
  FindManyCityByProvinceResponse,
  FindProvinceByIdResponse,
  ListProvinceResponse,
} from './location.res';

export interface LocationApi {
  findProvinceById(req: FindProvinceByIdRequest): Promise<FindProvinceByIdResponse>;
  findCityById(req: FindCityByIdRequest): Promise<FindCityByIdResponse>;
  findCitiesByProvince(req: FindManyCityByProvinceRequest): Promise<FindManyCityByProvinceResponse>;
  listProvince(): Promise<ListProvinceResponse>;
}
