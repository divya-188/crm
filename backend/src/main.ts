import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure raw body parsing for Stripe webhooks
  app.use(
    '/api/v1/subscriptions/webhooks/stripe',
    bodyParser.raw({ type: 'application/json' }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS - Allow multiple origins
  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('WhatsCRM API')
    .setDescription('WhatsApp CRM SaaS Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for authentication',
      },
      'api-key',
    )
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.example.com', 'Production Server')
    .addTag('API Keys', 'API Key management endpoints')
    .addTag('Public API', 'Public API endpoints for external integrations')
    .addTag('Contacts', 'Contact management')
    .addTag('Conversations', 'Conversation and messaging')
    .addTag('Templates', 'WhatsApp message templates')
    .addTag('Campaigns', 'Bulk messaging campaigns')
    .addTag('Flows', 'Chatbot flows')
    .addTag('Automations', 'Automation rules')
    .addTag('Analytics', 'Analytics and reporting')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
