// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { PrismaModule } from './database/prisma.module';
import { PostsModule } from './posts/posts.module';
import { ReactionsModule } from './reactions/reactions.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    UploadsModule,
    AiModule,
  ],
})
export class AppModule {}
