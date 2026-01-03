import { Resend } from "resend";
import { logger } from "../../shared/utils/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  private from: string;
  private frontendUrl: string;

  constructor() {
    const fromEmail = process.env.EMAIL_FROM || "noreply@dayflow.io";
    const fromName = process.env.EMAIL_FROM_NAME || "Dayflow HRMS";
    this.from = `${fromName} <${fromEmail}>`;
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  }

  private async send(
    to: string | string[],
    subject: string,
    html: string
  ): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        logger.warn("RESEND_API_KEY not configured, skipping email send", {
          to,
          subject,
        });
        return false;
      }

      const { error } = await resend.emails.send({
        from: this.from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (error) {
        logger.error("Failed to send email", error, { to, subject });
        return false;
      }

      logger.info("Email sent successfully", { to, subject });
      return true;
    } catch (error) {
      logger.error("Email sending failed", error, { to, subject });
      return false;
    }
  }

  async sendWelcomeEmail(data: {
    to: string;
    firstName: string;
    companyName: string;
    verificationToken: string;
  }): Promise<boolean> {
    const verificationLink = `${this.frontendUrl}/auth/verify-email?token=${data.verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Dayflow</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Dayflow! 🎉</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${data.firstName}</strong>,</p>
          <p style="font-size: 16px;">Thank you for registering <strong>${
            data.companyName
          }</strong> with Dayflow HRMS. Your account has been created successfully!</p>
          <p style="font-size: 16px;">Please verify your email address to get started:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; color: #666;">Or copy this link to your browser:</p>
          <p style="font-size: 12px; color: #888; word-break: break-all;">${verificationLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #666;">If you didn't create this account, please ignore this email.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(data.to, "Welcome to Dayflow - Verify Your Email", html);
  }

  async sendPasswordResetEmail(data: {
    to: string;
    firstName: string;
    resetToken: string;
  }): Promise<boolean> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${data.resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request 🔐</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${data.firstName}</strong>,</p>
          <p style="font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666;">Or copy this link to your browser:</p>
          <p style="font-size: 12px; color: #888; word-break: break-all;">${resetLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(data.to, "Reset Your Password - Dayflow", html);
  }

  async sendPasswordChangedEmail(data: { to: string }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed ✓</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Your password has been changed successfully.</p>
          <p style="font-size: 16px;">If you did not make this change, please contact support immediately.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              this.frontendUrl
            }/auth/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login to Your Account</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(data.to, "Your Password Has Been Changed - Dayflow", html);
  }

  async sendInviteEmail(data: {
    to: string;
    firstName: string;
    inviterName: string;
    companyName: string;
    inviteToken: string;
    role: string;
  }): Promise<boolean> {
    const inviteLink = `${this.frontendUrl}/auth/accept-invite?token=${data.inviteToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited! 🎉</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${data.firstName}</strong>,</p>
          <p style="font-size: 16px;"><strong>${
            data.inviterName
          }</strong> has invited you to join <strong>${
      data.companyName
    }</strong> on Dayflow HRMS as a <strong>${data.role.replace(
      "_",
      " "
    )}</strong>.</p>
          <p style="font-size: 16px;">Click the button below to accept the invitation and set up your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="font-size: 14px; color: #666;">Or copy this link to your browser:</p>
          <p style="font-size: 12px; color: #888; word-break: break-all;">${inviteLink}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 14px; color: #666;">This invitation will expire in 7 days.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(
      data.to,
      `You're invited to join ${data.companyName} on Dayflow`,
      html
    );
  }

  async sendLeaveRequestEmail(data: {
    to: string;
    managerName: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    approvalLink: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Leave Request 📅</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${
            data.managerName
          }</strong>,</p>
          <p style="font-size: 16px;"><strong>${
            data.employeeName
          }</strong> has submitted a leave request:</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Leave Type:</strong> ${data.leaveType}</p>
            <p><strong>From:</strong> ${data.startDate}</p>
            <p><strong>To:</strong> ${data.endDate}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              data.approvalLink
            }" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Review Request</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(data.to, `Leave Request from ${data.employeeName}`, html);
  }

  async sendLeaveApprovedEmail(data: {
    to: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    approverName: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Leave Approved ✓</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${
            data.employeeName
          }</strong>,</p>
          <p style="font-size: 16px;">Your leave request has been <strong style="color: #38a169;">approved</strong>!</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Leave Type:</strong> ${data.leaveType}</p>
            <p><strong>From:</strong> ${data.startDate}</p>
            <p><strong>To:</strong> ${data.endDate}</p>
            <p><strong>Approved by:</strong> ${data.approverName}</p>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(data.to, "Your Leave Request Has Been Approved", html);
  }

  async sendLeaveRejectedEmail(data: {
    to: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    approverName: string;
    reason?: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Leave Request Update</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${
            data.employeeName
          }</strong>,</p>
          <p style="font-size: 16px;">Unfortunately, your leave request has been <strong style="color: #e53e3e;">rejected</strong>.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Leave Type:</strong> ${data.leaveType}</p>
            <p><strong>From:</strong> ${data.startDate}</p>
            <p><strong>To:</strong> ${data.endDate}</p>
            <p><strong>Reviewed by:</strong> ${data.approverName}</p>
            ${
              data.reason
                ? `<p><strong>Reason:</strong> ${data.reason}</p>`
                : ""
            }
          </div>
          <p style="font-size: 14px; color: #666;">Please contact your manager if you have any questions.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(data.to, "Leave Request Update", html);
  }

  async sendPayrollGeneratedEmail(data: {
    to: string;
    employeeName: string;
    month: string;
    year: number;
    netSalary: string;
    payslipLink: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Payslip Available 💰</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hi <strong>${
            data.employeeName
          }</strong>,</p>
          <p style="font-size: 16px;">Your payslip for <strong>${data.month} ${
      data.year
    }</strong> is now available.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="font-size: 14px; color: #666; margin: 0;">Net Salary</p>
            <p style="font-size: 32px; color: #667eea; font-weight: bold; margin: 10px 0;">₹${
              data.netSalary
            }</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              data.payslipLink
            }" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Payslip</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return this.send(
      data.to,
      `Your Payslip for ${data.month} ${data.year} is Ready`,
      html
    );
  }
}

export const emailService = new EmailService();
