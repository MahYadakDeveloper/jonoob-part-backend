import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { azkivamConfig } from './azkivam.config';
import { appConfig } from '@infra/config';

@Module({
  imports: [ConfigModule.forFeature(azkivamConfig), ConfigModule.forFeature(appConfig)],
})
export class AzkivamGatewayModule {}
