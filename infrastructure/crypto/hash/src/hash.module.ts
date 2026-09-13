import { Module } from '@nestjs/common';
import { HashServiceImpl } from './hash.service';

@Module({
  providers: [
    {
      provide: HashServiceImpl,
      useFactory: () => new HashServiceImpl(12),
    },
  ],
})
export class HashModule {}
