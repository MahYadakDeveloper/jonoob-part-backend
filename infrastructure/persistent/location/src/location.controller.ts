import { Controller, Post } from '@nestjs/common';
import { LocationRepository } from './location.repository';

// [TODO] Use guard, the access is only for admin
@Controller('location')
export class LocationController {
  constructor(private readonly location: LocationRepository) {}

  @Post('init')
  init() {
    return this.location.initialize();
  }
}
