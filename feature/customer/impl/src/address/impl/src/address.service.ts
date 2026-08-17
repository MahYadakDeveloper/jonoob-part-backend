export class AddressService {
  addAddress(req: {
    coordinate?: {
      longitude: number;
      latitude: number;
    };
    provinceId: number; // Khuzestan
    cityId: number;
    address: string;
  }) {}

  private resolveScope(provinceId: number, cityId: number): 'inter-city' | 'intra-city' {
    if (provinceId !== 20)
      // Khuzestan
      return 'inter-city';

    switch (cityId) {
      case 1616: // Chamrun
        return 'intra-city';
      case 684: // bandar-e-mum
        return 'intra-city';
      case 200: // Mahshahr
        return 'intra-city';
      default:
        return 'inter-city';
    }
  }
}
