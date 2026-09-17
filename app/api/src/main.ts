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
import { AppModule } from './app.module';

/**
 * [NOTE] @fastify/static is required for openapi/swagger
 */

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      querystringParser: (str) => qs.parse(str),
    }),
  );

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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
