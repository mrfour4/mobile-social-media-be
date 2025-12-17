import { Module } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationsModule],
  providers: [AdminService, EmailService],
  controllers: [AdminController],
})
export class AdminModule {}
