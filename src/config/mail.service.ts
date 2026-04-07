import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getInvitationStaffTemplate } from '../auth/templates/invitation-staff.template';
import { getAccountActivatedTemplate } from '../auth/templates/account-activated.template';
import { getMembershipConfirmationTemplate } from '../auth/templates/membership-confirmation.template';
import { getMembershipApprovedTemplate } from '../auth/templates/membership-approved.template';
import { getMembershipRejectedTemplate } from '../auth/templates/membership-rejected.template';

@Injectable()
export class MailService {
  private transporter?: nodemailer.Transporter;
  private logger = new Logger(MailService.name);
  private frontendUrl: string;
  private mailEnabled = false;

  constructor(private configService: ConfigService) {
    this.frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';

    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';

    const parseBoolean = (value: string) =>
      ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());

    const host = this.configService.get<string>('MAIL_HOST');
    const portRaw = this.configService.get<string>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const from = this.configService.get<string>('MAIL_FROM') || user;

    const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
    const mailSecureRaw = this.configService.get<string>('MAIL_SECURE');
    const secure =
      typeof mailSecureRaw === 'string'
        ? parseBoolean(mailSecureRaw)
        : port === 465;

    const mailRequireTlsRaw = this.configService.get<string>('MAIL_REQUIRE_TLS');
    const requireTLS =
      typeof mailRequireTlsRaw === 'string'
        ? parseBoolean(mailRequireTlsRaw)
        : undefined;

    const missing: string[] = [];
    if (!host) missing.push('MAIL_HOST');
    if (!user) missing.push('MAIL_USER');
    if (!pass) missing.push('MAIL_PASS');

    if (missing.length > 0) {
      const message = `Mail désactivé: variables manquantes (${missing.join(', ')}).`;
      if (nodeEnv === 'production') {
        throw new Error(message);
      }
      this.logger.warn(message);
      return;
    }

    const placeholderPattern = /(your_|votre_|example|changeme|change_this)/i;
    const placeholders: string[] = [];
    if (user && placeholderPattern.test(user)) placeholders.push('MAIL_USER');
    if (pass && placeholderPattern.test(pass)) placeholders.push('MAIL_PASS');
    if (placeholders.length > 0) {
      this.logger.warn(
        `Configuration email probablement non renseignée (placeholders détectés: ${placeholders.join(', ')}).`,
      );
    }

    this.mailEnabled = true;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      ...(typeof requireTLS === 'boolean' ? { requireTLS } : {}),
    });

    if (!from) {
      this.logger.warn('MAIL_FROM non défini; fallback sur MAIL_USER.');
    }
  }

  /**
   * Envoyer un email générique
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.mailEnabled || !this.transporter) {
      this.logger.warn(`✉️  Email ignoré (mail désactivé) -> ${to}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM') || this.configService.get('MAIL_USER'),
        to,
        subject,
        html,
      });
      this.logger.log(`✉️  Email sent to ${to}`);
    } catch (error) {
      const host = this.configService.get<string>('MAIL_HOST') || '';
      if ((error as any)?.code === 'EAUTH' && host.includes('gmail.com')) {
        this.logger.error(
          'Gmail auth error (535): utilise un mot de passe d’application (App Password) et pas le mot de passe Gmail.',
        );
      }
      this.logger.error(`❌ Failed to send email to ${to}:`, error);
      // En développement, ne pas lever d'erreur si l'email échoue
      if (this.configService.get('NODE_ENV') === 'production') {
        throw error;
      }
    }
  }

  // ═══════════════════════════════════════════════
  // AUTH EMAILS
  // ═══════════════════════════════════════════════

  /**
   * Email d'invitation staff (admin crée un compte)
   */
  async sendInvitation(
    email: string,
    firstName: string,
    role: string,
    token: string,
  ): Promise<void> {
    const emailContent = getInvitationStaffTemplate({
      firstName,
      role,
      token,
      email,
      frontendUrl: this.frontendUrl,
    });

    await this.sendEmail(email, emailContent.subject, emailContent.html);
  }

  /**
   * Email de confirmation d'activation de compte
   */
  async sendAccountActivated(
    email: string,
    firstName: string,
  ): Promise<void> {
    const emailContent = getAccountActivatedTemplate({
      firstName,
      email,
      frontendUrl: this.frontendUrl,
    });

    await this.sendEmail(email, emailContent.subject, emailContent.html);
  }

  // ═══════════════════════════════════════════════
  // MEMBERSHIP EMAILS
  // ═══════════════════════════════════════════════

  /**
   * Email de confirmation de réception d'adhésion
   */
  async sendMembershipConfirmation(
    email: string,
    firstName: string,
  ): Promise<void> {
    const emailContent = getMembershipConfirmationTemplate({
      firstName,
      email,
      frontendUrl: this.frontendUrl,
    });

    await this.sendEmail(email, emailContent.subject, emailContent.html);
  }

  /**
   * Email de bienvenue (adhésion acceptée)
   */
  async sendMembershipApproved(
    email: string,
    firstName: string,
    lastName: string,
    membershipNumber: string,
  ): Promise<void> {
    const emailContent = getMembershipApprovedTemplate({
      firstName,
      lastName,
      email,
      membershipNumber,
      frontendUrl: this.frontendUrl,
    });

    await this.sendEmail(email, emailContent.subject, emailContent.html);
  }

  /**
   * Email de refus d'adhésion
   */
  async sendMembershipRejected(
    email: string,
    firstName: string,
    rejectionReason?: string,
  ): Promise<void> {
    const emailContent = getMembershipRejectedTemplate({
      firstName,
      email,
      rejectionReason,
      frontendUrl: this.frontendUrl,
    });

    await this.sendEmail(email, emailContent.subject, emailContent.html);
  }
}
