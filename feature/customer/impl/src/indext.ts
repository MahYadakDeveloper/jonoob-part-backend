export type CustomerAddress = {
  coordinate?: {
    longitude: number;
    latitude: number;
  };
  provinceId: number; // Khuzestan
  cityId: number;
  address: string;
};
