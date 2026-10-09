import { Controller, Post, UseGuards } from '@nestjs/common';
import { ManagerService } from './manager.service';

@Controller()
export class ManagerController {
  constructor(private readonly manager: ManagerService) {}

  @UseGuards()
  @Post('create')
  createOne() {}
}
