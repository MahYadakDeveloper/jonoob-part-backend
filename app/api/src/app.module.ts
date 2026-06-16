import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IWarehouseRepositoryToken, WarehouseModule } from '@feature/warehouse';
import { PrismaWarehouseRepository } from '@infra/warehouse-repo';
import { DatabaseModule } from '@infra/database';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development',
    }),
    DatabaseModule,
    WarehouseModule.register([
      {
        provide: IWarehouseRepositoryToken,
        useClass: PrismaWarehouseRepository,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
