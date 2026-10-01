import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter, ResponseInterceptor, validationExceptionFactory } from './common/response';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(','), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: validationExceptionFactory }));
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const doc = new DocumentBuilder()
    .setTitle('Farm Story API')
    .setDescription('Farmer onboarding, farm intelligence, service requests, admin dashboard and AI assistant. ' +
      'All responses use the envelope { success, message, data } (errors: { success:false, message, error }).')
    .setVersion('1.0')
    .addCookieAuth('farmstory_token').addTag('Auth').addTag('Farmers').addTag('Farms').addTag('Insights').addTag('Service Requests').addTag('Agronomists').addTag('Farm Passport').addTag('AI').addTag('Dashboard')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Farm Story API on http://localhost:${port}/api  (docs: /api/docs)`);
}
bootstrap();
