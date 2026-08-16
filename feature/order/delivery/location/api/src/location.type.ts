export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  province: Province;
}
