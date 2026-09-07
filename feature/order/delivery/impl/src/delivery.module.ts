import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configs from './delivery.config';

@Module({
  imports: [ConfigModule.forFeature(configs)],
})
export class DeliveryModule {}
