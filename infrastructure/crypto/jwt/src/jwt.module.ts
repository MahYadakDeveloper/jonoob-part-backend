import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import tokenConfig from './jwt.config';
import { JwtService } from './jwt.service';

@Module({
  imports: [ConfigModule.forFeature(tokenConfig), NestJwtModule.register({})],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
