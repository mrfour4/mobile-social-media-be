// src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port: this.config.get<number>('SMTP_PORT'),
        secure: false,
        auth: { user, pass },
      });
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    // nếu chưa cấu hình SMTP thì log ra console cho demo
    if (!this.transporter) {
      this.logger.log(`[MOCK EMAIL] To: ${to} | ${subject}\n${html}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_USER'),
      to,
      subject,
      html,
    });
  }
}
