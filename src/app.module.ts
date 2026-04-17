import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { ProfileModule } from './profile/profile.module';
import { MembershipModule } from './membership/membership.module';
import { PrismaModule } from './config/prisma.module';
import { UploadModule } from './upload/upload.module';
import { PostsModule } from './posts/posts.module';
import { EventsModule } from './events/events.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    BlogModule,
    OpportunitiesModule,
    ProfileModule,
    MembershipModule,
    UploadModule,
    PostsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
