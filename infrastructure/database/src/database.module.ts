import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [ConfigService],
  exports: [PrismaService],
})
export class DatabaseModule {}
