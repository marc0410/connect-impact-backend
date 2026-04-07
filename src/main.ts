import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ═══════════════════════════════════════════════
  // Global Prefix
  // ═══════════════════════════════════════════════
  app.setGlobalPrefix('api/v1');

  // ═══════════════════════════════════════════════
  // CORS Configuration
  // ═══════════════════════════════════════════════
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ═══════════════════════════════════════════════
  // Global Validation Pipe
  // ═══════════════════════════════════════════════
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          field: error.property,
          messages: Object.values(error.constraints || {}),
        }));
        return new BadRequestException({
          message: 'Validation failed',
          errors: messages,
        });
      },
    }),
  );

  // ═══════════════════════════════════════════════
  // Swagger Configuration
  // ═══════════════════════════════════════════════
  const config = new DocumentBuilder()
    .setTitle('Connect Impact API')
    .setDescription(
      'API de gestion pour l\'association Connect Impact. Un seul point d\'entrée pour tous les utilisateurs (members, staff, admins).',
    )
    .setVersion('1.0.0')
    .setContact(
      'Connect Impact',
      'https://connectimpact.fr',
      'contact@connectimpact.fr',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Entre votre JWT access token',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentification et gestion des comptes')
    .addTag('Membership', 'Gestion des adhésions')
    .addTag('Profile', 'Profils des membres')
    .addTag('Blog', 'Articles et actualités')
    .addTag('Opportunities', 'Opportunités d\'emploi, stage, bénévolat')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ═══════════════════════════════════════════════
  // Start Application
  // ═══════════════════════════════════════════════
  const port = process.env.APP_PORT ?? 3000;
  const env = process.env.NODE_ENV || 'development';

  await app.listen(port);

  console.log(`
    ╔════════════════════════════════════════╗
    ║    🚀 Connect Impact API Started       ║
    ╠════════════════════════════════════════╣
    ║ Environment   : ${env.padEnd(25)}║
    ║ Port          : ${port.toString().padEnd(25)}║
    ║ API Base URL  : http://localhost:${port.toString().padEnd(11)}║
    ║ Swagger Docs  : http://localhost:${port.toString().padEnd(11)}║
    ╠════════════════════════════════════════╣
    ║ Ready to accept requests ✓             ║
    ╚════════════════════════════════════════╝
  `);

  // Log startup info
  console.log(`
📚 API Routes:
   - POST   /api/v1/auth/login          - Se connecter
   - POST   /api/v1/auth/activate       - Activer un compte
   - POST   /api/v1/membership/apply    - Soumettre une demande d'adhésion
   - GET    /api/v1/auth/me             - Mon profil (protégé)

📖 Documentation:
   - Swagger UI  : http://localhost:${port}/api/docs
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
