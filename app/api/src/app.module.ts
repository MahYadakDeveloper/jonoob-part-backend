import { WAREHOUSE_REPOSITORY, WarehouseModule } from '@feature/warehouse';
import { DatabaseModule } from '@infra/database';
import { PrismaWarehouseRepository } from '@infra/warehouse-repo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development',
    }),
    DatabaseModule,
    WarehouseModule.register([
      {
        provide: WAREHOUSE_REPOSITORY,
        useClass: PrismaWarehouseRepository,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
