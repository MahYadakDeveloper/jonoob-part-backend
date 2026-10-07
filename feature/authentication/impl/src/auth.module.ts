import { HashService } from '@infra/crypto-hash';
import { JwtModule } from '@infra/crypto-jwt';
import { Module } from '@nestjs/common';

@Module({
  imports: [JwtModule],
  providers: [
    {
      provide: HashService,
      useFactory: () => new HashService(12),
    },
  ],
})
export class AuthenticationModule {}
