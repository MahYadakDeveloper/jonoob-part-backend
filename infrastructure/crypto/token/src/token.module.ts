import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import tokenConfig from './token.config';

@Module({
  imports: [ConfigModule.forFeature(tokenConfig), JwtModule.register({})],
})
export class TokenModule {}
