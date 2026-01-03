import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmployeeCredentials(
    email: string,
    name: string,
    loginId: string,
    tempPassword: string,
    companyName: string
) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is not set. Skipping email sending.");
        return { success: false, error: "Missing API Key" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev', // Use verified domain or environment variable
            to: [email],
            subject: `Welcome to ${companyName} - Your Login Credentials`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to ${companyName}!</h2>
          <p style="color: #333; line-height: 1.6;">Hello ${name},</p>
          <p style="color: #333; line-height: 1.6;">Your employee account has been successfully created. We are excited to have you on board!</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #555;">Your Login Credentials:</p>
            <p style="margin: 5px 0;"><strong>Login ID:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px;">${loginId}</span></p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px;">${tempPassword}</span></p>
          </div>

          <p style="color: #333; line-height: 1.6;">Please log in at <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" style="color: #4f46e5;">Employee Portal</a> and change your password immediately.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">This is an automated message from Dayflow HRMS. Please do not reply to this email.</p>
        </div>
      `,
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error("Email sending exception:", err);
        return { success: false, error: err };
    }
}
