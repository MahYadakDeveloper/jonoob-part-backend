import multipart from '@fastify/multipart';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import qs from 'qs';
import { createSchema } from 'zod-openapi';
import { AppModule } from './modules/app.module';

/**
 * [NOTE] @fastify/static is required for openapi/swagger
 */

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      querystringParser: (str) => qs.parse(str),
    }),
  );

  app.register(multipart);

  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Jonoob Part API')
      .setDescription('Jonoob Part backend API')
      .setVersion('1.0')
      .build();

    const documentOptions: SwaggerDocumentOptions = {
      standardSchemaConverter: (schema, { schemaType }) => {
        const converted = createSchema(schema as never, {
          io: schemaType,
          openapiVersion: '3.0.0',
        });
        return { schema: converted.schema, components: converted.components };
      },
    };

    const documentFactory = () =>
      SwaggerModule.createDocument(app, config, documentOptions);
    SwaggerModule.setup('api', app, documentFactory);
  }

  await app.listen(3000, '0.0.0.0');
}

bootstrap();
