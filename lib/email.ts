import { Resend } from "resend";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(
        "⚠️ RESEND_API_KEY not configured. Email would be sent to:",
        to
      );
      console.log("Subject:", subject);
      console.log("HTML:", html);
      return { success: true };
    }

    // Initialize Resend only when we have an API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "PropFusion <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("✅ Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return { success: false, error };
  }
}

export function getVerificationEmailTemplate(url: string, userName?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PropFusion</h1>
    </div>
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>Hi${userName ? ` ${userName}` : ""},</p>
      <p>Thanks for signing up for PropFusion! Please verify your email address by clicking the button below:</p>
      <a href="${url}" class="button">Verify Email Address</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${url}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account with PropFusion, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PropFusion. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}

export function getPasswordResetEmailTemplate(url: string, userName?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PropFusion</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hi${userName ? ` ${userName}` : ""},</p>
      <p>We received a request to reset your password for your PropFusion account.</p>
      <a href="${url}" class="button">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${url}</p>
      <div class="warning">
        <strong>⚠️ Security Notice:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PropFusion. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}

export function getRentReceiptEmailTemplate({
  tenantName,
  propertyName,
  propertyAddress,
  amount,
  paymentDate,
  period,
  receiptNumber,
  paymentMethod,
  paymentLast4,
  receiptUrl,
}: {
  tenantName: string;
  propertyName: string;
  propertyAddress: string;
  amount: number;
  paymentDate: string;
  period: string;
  receiptNumber: string;
  paymentMethod: string;
  paymentLast4?: string;
  receiptUrl: string;
}) {
  const safe = (value: string) =>
    value.replace(/[&<>'"]/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character,
    );

  const amountLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PropFusion Rent Receipt</title>
</head>
<body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#172033">
  <div style="max-width:620px;margin:0 auto;padding:28px 16px">
    <div style="background:#111827;color:#fff;border-radius:14px 14px 0 0;padding:26px 30px">
      <div style="font-size:24px;font-weight:700">PropFusion</div>
      <div style="margin-top:6px;color:#cbd5e1">Rent payment receipt</div>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:30px">
      <h1 style="font-size:22px;margin:0 0 12px">Payment received</h1>
      <p style="line-height:1.6;margin:0 0 22px">Hi ${safe(tenantName)}, your rent payment has been successfully recorded. Keep this email as a copy of your receipt.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px">
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#64748b">Receipt number</td><td style="padding:8px 0;text-align:right;font-weight:700">${safe(receiptNumber)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Amount paid</td><td style="padding:8px 0;text-align:right;font-weight:700">${amountLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Payment date</td><td style="padding:8px 0;text-align:right">${safe(paymentDate)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Rent period</td><td style="padding:8px 0;text-align:right">${safe(period)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Property</td><td style="padding:8px 0;text-align:right">${safe(propertyName)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Address</td><td style="padding:8px 0;text-align:right">${safe(propertyAddress)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Payment method</td><td style="padding:8px 0;text-align:right">${safe(paymentMethod)}${paymentLast4 ? ` ending in ${safe(paymentLast4)}` : ""}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin-top:24px">
        <a href="${safe(receiptUrl)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700">View printable receipt</a>
      </div>
      <p style="font-size:12px;color:#64748b;line-height:1.5;margin:24px 0 0">This receipt confirms a simulated payment recorded in PropFusion. It is not a bank or card-network statement.</p>
    </div>
  </div>
</body>
</html>`;
}

export function getSupportAcknowledgementEmailTemplate({
  tenantName,
  ticketNumber,
  subject,
  managerEmail,
  managerPhone,
  frontDesk,
}: {
  tenantName: string;
  ticketNumber: string;
  subject: string;
  managerEmail: string;
  managerPhone?: string;
  frontDesk?: string;
}) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:32px auto;background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><div style="background:#111827;color:white;padding:24px"><h1 style="margin:0">PropFusion Support</h1></div><div style="padding:28px"><h2 style="margin-top:0">We received your request</h2><p>Hi ${tenantName},</p><p>Your support request has been received and forwarded to property management.</p><div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:20px 0"><p style="margin:0 0 8px"><strong>Ticket:</strong> ${ticketNumber}</p><p style="margin:0"><strong>Subject:</strong> ${subject}</p></div><p>A manager will get back to you within <strong>2–3 business days</strong>.</p><p>For more information, you can email <strong>${managerEmail}</strong>${managerPhone ? `, call <strong>${managerPhone}</strong>` : ""}, or visit <strong>${frontDesk || "the property front desk"}</strong> in person.</p><p style="font-size:12px;color:#64748b;margin-top:24px">For emergencies or immediate safety concerns, contact local emergency services.</p></div></div></body></html>`;
}

export function getManagerSupportRequestEmailTemplate({
  ticketNumber,
  tenantName,
  tenantEmail,
  category,
  subject,
  message,
  propertyName,
  createdAt,
}: {
  ticketNumber: string;
  tenantName: string;
  tenantEmail: string;
  category: string;
  subject: string;
  message: string;
  propertyName: string;
  createdAt: string;
}) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:32px auto;background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><div style="background:#111827;color:white;padding:24px"><h1 style="margin:0">New Tenant Support Request</h1></div><div style="padding:28px"><p><strong>Ticket:</strong> ${ticketNumber}</p><p><strong>Tenant:</strong> ${tenantName} (${tenantEmail})</p><p><strong>Property:</strong> ${propertyName}</p><p><strong>Category:</strong> ${category}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Submitted:</strong> ${new Date(createdAt).toLocaleString("en-US")}</p><div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-top:20px;white-space:pre-wrap">${message}</div></div></div></body></html>`;
}
