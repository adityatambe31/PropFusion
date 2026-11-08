import { betterAuth } from "better-auth";
import { MongoClient, ServerApiVersion } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { twoFactor } from "better-auth/plugins";
import { Resend } from "resend";
import { resolveAppURL } from "@/lib/url";

const fromEmail = process.env.RESEND_FROM_EMAIL || "PropFusion <onboarding@resend.dev>";

async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY is not configured. Skipping transactional email:",
      subject,
      "->",
      to,
    );
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });
}

const dbUrl = process.env.MONGODB_URI;

let authInstance: ReturnType<typeof betterAuth> | undefined;

if (dbUrl) {
  const client = new MongoClient(dbUrl, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    maxPoolSize: 10,
    minPoolSize: 1,
  });

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect();
  }

  const db = client.db("propfusion");

  const appBaseURL = resolveAppURL();

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    appName: "PropFusion",
    baseURL: appBaseURL,
    trustedOrigins: [appBaseURL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        const name = user.name || user.email.split("@")[0];
        try {
          await sendTransactionalEmail({
            to: user.email,
            subject: "Reset your PropFusion password",
            html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
              <h2 style="color:#111;margin-bottom:8px">Reset your password</h2>
              <p style="color:#444">Hi ${name},</p>
              <p style="color:#444">We received a request to reset your PropFusion password. Click the button below to choose a new one.</p>
              <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Reset Password</a>
              <p style="color:#888;font-size:13px">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color:#888;font-size:12px;word-break:break-all">${url}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
              <p style="color:#aaa;font-size:12px">If you didn't request a password reset, you can safely ignore this email. This link expires in 1 hour.</p>
            </div>
          `,
          });
          console.log(`✅ Password reset email sent to ${user.email}`);
        } catch (error) {
          console.error(`❌ Failed to send password reset email to ${user.email}:`, error);
          throw error;
        }
      },
      onPasswordReset: async ({ user }) => {
        console.log(`✅ Password for user ${user.email} has been reset successfully!`);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const name = user.name || user.email.split("@")[0];
        try {
          const verificationUrl = new URL(url);
          if (!verificationUrl.searchParams.get("callbackURL")) {
            verificationUrl.searchParams.set("callbackURL", "/auth/post-signin-redirect");
          }
          const finalUrl = verificationUrl.toString();

          await sendTransactionalEmail({
            to: user.email,
            subject: "Verify your email – PropFusion",
            html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
              <h2 style="color:#111;margin-bottom:8px">Verify your email</h2>
              <p style="color:#444">Hi ${name},</p>
              <p style="color:#444">Thanks for signing up for PropFusion! Click the button below to verify your email address and activate your account.</p>
              <a href="${finalUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Verify Email</a>
              <p style="color:#888;font-size:13px">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color:#888;font-size:12px;word-break:break-all">${finalUrl}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
              <p style="color:#aaa;font-size:12px">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          `,
          });
          console.log(`✅ Verification email sent to ${user.email}`);
        } catch (error) {
          console.error(`❌ Failed to send verification email to ${user.email}:`, error);
          throw error;
        }
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "manager", input: false },
        leaseId: { type: "string", required: false, input: false },
        tenantId: { type: "string", required: false, input: false },
      },
      deleteUser: {
        enabled: true,
      },
      changeUsername: {
        enabled: true,
      },
      changePassword: {
        enabled: true,
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async (data) => {
          const name = data.user.name || data.user.email.split("@")[0];
          await sendTransactionalEmail({
            to: data.newEmail,
            subject: "Verify your new email – PropFusion",
            html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px">
              <h2 style="color:#111;margin-bottom:8px">Verify your new email</h2>
              <p style="color:#444">Hi ${name},</p>
              <p style="color:#444">Click the button below to confirm this email address for your PropFusion account.</p>
              <a href="${data.url}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Verify New Email</a>
              <p style="color:#888;font-size:13px">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color:#888;font-size:12px;word-break:break-all">${data.url}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
              <p style="color:#aaa;font-size:12px">If you didn't request this change, please contact support immediately.</p>
            </div>
          `,
          });
        },
      },
    },
    session: {
      cookieCache: {
        enabled: false,
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      cookiePrefix: "better-auth",
    },
    plugins: [
      twoFactor({
        issuer: "PropFusion",
        skipVerificationOnEnable: false,
      }),
    ],
  });
}

if (!authInstance) {
  console.warn("MONGODB_URI is not defined; auth is disabled during build or local startup without a database.");
}

export const auth = authInstance as ReturnType<typeof betterAuth>;

// Type declaration for global
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
