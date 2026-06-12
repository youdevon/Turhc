import nodemailer from "nodemailer";
import type { Enquiry } from "@prisma/client";
import { formatEnquiryType, getEnquiryDisplayName } from "./enquiry-types";
import { decryptSecret, isEncryptedSecret } from "./secret-crypto";
import { buildTransportOptions, formatFromAddress } from "./smtp-settings";
import { getSiteSettings, getSiteSettingsFresh } from "./settings";

export type SmtpEncryption = "none" | "starttls" | "ssl";

export type SmtpConfig = {
  host: string;
  port: number;
  encryption: SmtpEncryption;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
};

function parseEncryptionFromEnv(): SmtpEncryption {
  const mode = process.env.SMTP_ENCRYPTION?.trim().toLowerCase();
  if (mode === "none" || mode === "starttls" || mode === "ssl") return mode;
  return process.env.SMTP_SECURE === "true" ? "ssl" : "starttls";
}

export function getSmtpConfigFromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  if (!host || !fromEmail) return null;

  if (process.env.SMTP_ENABLED === "false") return null;

  return {
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    encryption: parseEncryptionFromEnv(),
    user: process.env.SMTP_USER?.trim() ?? "",
    password: process.env.SMTP_PASSWORD?.trim() ?? "",
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "Website Enquiries",
    replyTo: process.env.SMTP_REPLY_TO?.trim() || undefined,
  };
}

async function getSmtpConfigFromDb(): Promise<SmtpConfig | null> {
  const settings = await getSiteSettingsFresh();
  if (settings.smtpEnabled !== "true") return null;

  const host = settings.smtpHost?.trim();
  const fromEmail = settings.smtpFromEmail?.trim();
  if (!host || !fromEmail) return null;

  let password = "";
  const storedPassword = settings.smtpPassword?.trim();
  if (storedPassword) {
    if (isEncryptedSecret(storedPassword)) {
      try {
        password = decryptSecret(storedPassword);
      } catch (error) {
        console.warn("Failed to decrypt SMTP password from site settings:", error);
      }
    } else {
      password = storedPassword;
    }
  }

  const encryption = settings.smtpEncryption as SmtpEncryption;
  const validEncryption =
    encryption === "none" || encryption === "starttls" || encryption === "ssl"
      ? encryption
      : "starttls";

  return {
    host,
    port: parseInt(settings.smtpPort || "587", 10),
    encryption: validEncryption,
    user: settings.smtpUser?.trim() ?? "",
    password,
    fromEmail,
    fromName: settings.smtpFromName?.trim() || "Website Notifications",
    replyTo: settings.smtpReplyTo?.trim() || undefined,
  };
}

/** Resolve SMTP config: CMS settings take precedence over environment variables. */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const settings = await getSiteSettingsFresh();
  const cmsConfigured = Boolean(settings.smtpHost?.trim() && settings.smtpFromEmail?.trim());
  if (cmsConfigured) {
    return getSmtpConfigFromDb();
  }
  return getSmtpConfigFromEnv();
}

export async function isSmtpConfigured(): Promise<boolean> {
  return (await getSmtpConfig()) !== null;
}

function createTransport(config: SmtpConfig) {
  return nodemailer.createTransport(buildTransportOptions(config));
}

function parseEmailList(value: string | undefined | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export async function getEnquiryForwardRecipients(): Promise<{
  enabled: boolean;
  to: string[];
  cc: string[];
  bcc: string[];
  subjectPrefix: string;
}> {
  const settings = await getSiteSettings();
  const envTo = parseEmailList(process.env.ENQUIRY_FORWARD_TO);
  const envCc = parseEmailList(process.env.ENQUIRY_FORWARD_CC);
  const envBcc = parseEmailList(process.env.ENQUIRY_FORWARD_BCC);

  const cmsTo = parseEmailList(settings.enquiryForwardTo);
  const cmsCc = parseEmailList(settings.enquiryForwardCc);
  const cmsBcc = parseEmailList(settings.enquiryForwardBcc);

  return {
    enabled: settings.enquiryEmailForwardingEnabled === "true",
    to: cmsTo.length > 0 ? cmsTo : envTo,
    cc: cmsCc.length > 0 ? cmsCc : envCc,
    bcc: cmsBcc.length > 0 ? cmsBcc : envBcc,
    subjectPrefix: settings.enquiryEmailSubjectPrefix?.trim() || "New Website Enquiry",
  };
}

function getAdminBaseUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3010"
  ).replace(/\/$/, "");
}

function buildEnquiryEmailContent(enquiry: Enquiry, subjectPrefix: string) {
  const name = getEnquiryDisplayName(enquiry);
  const typeLabel = formatEnquiryType(enquiry.enquiryType);
  const submittedAt = enquiry.createdAt.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const adminUrl = `${getAdminBaseUrl()}/admin/enquiries/${enquiry.id}`;
  const subject = `${subjectPrefix} — ${typeLabel} — ${name}`;

  const lines = [
    `Submitted: ${submittedAt}`,
    `Name: ${name}`,
    enquiry.companyName ? `Company: ${enquiry.companyName}` : null,
    `Email: ${enquiry.email}`,
    enquiry.phone ? `Phone: ${enquiry.phone}` : null,
    `Enquiry type: ${typeLabel}`,
    enquiry.subject ? `Subject: ${enquiry.subject}` : null,
    enquiry.relatedTenderRef ? `Tender reference: ${enquiry.relatedTenderRef}` : null,
    enquiry.relatedProjectRef ? `Project reference: ${enquiry.relatedProjectRef}` : null,
    "",
    "Message:",
    enquiry.message,
    "",
    `View in admin: ${adminUrl}`,
  ].filter((line): line is string => line !== null);

  const text = lines.join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 640px;">
  <div style="background: #0f172a; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 18px;">${subjectPrefix}</h1>
    <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">${typeLabel} from ${name}</p>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 6px 0; color: #6b7280; width: 140px;">Submitted</td><td>${submittedAt}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Name</td><td>${name}</td></tr>
      ${enquiry.companyName ? `<tr><td style="padding: 6px 0; color: #6b7280;">Company</td><td>${enquiry.companyName}</td></tr>` : ""}
      <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td><a href="mailto:${enquiry.email}">${enquiry.email}</a></td></tr>
      ${enquiry.phone ? `<tr><td style="padding: 6px 0; color: #6b7280;">Phone</td><td>${enquiry.phone}</td></tr>` : ""}
      <tr><td style="padding: 6px 0; color: #6b7280;">Type</td><td>${typeLabel}</td></tr>
      ${enquiry.subject ? `<tr><td style="padding: 6px 0; color: #6b7280;">Subject</td><td>${enquiry.subject}</td></tr>` : ""}
      ${enquiry.relatedTenderRef ? `<tr><td style="padding: 6px 0; color: #6b7280;">Tender ref</td><td>${enquiry.relatedTenderRef}</td></tr>` : ""}
      ${enquiry.relatedProjectRef ? `<tr><td style="padding: 6px 0; color: #6b7280;">Project ref</td><td>${enquiry.relatedProjectRef}</td></tr>` : ""}
    </table>
    <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; white-space: pre-wrap; font-size: 14px;">${enquiry.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    <p style="margin-top: 24px;">
      <a href="${adminUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View in Admin Panel</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export async function sendEnquiryNotificationEmail(
  enquiry: Enquiry
): Promise<{ success: true } | { success: false; error: string }> {
  const smtp = await getSmtpConfig();
  if (!smtp) {
    console.warn("Enquiry email not sent: SMTP is not configured or disabled.");
    return {
      success: false,
      error: "SMTP is not configured or email sending is disabled.",
    };
  }

  const recipients = await getEnquiryForwardRecipients();
  if (!recipients.enabled) {
    return { success: false, error: "Email forwarding is disabled in site settings" };
  }

  if (recipients.to.length === 0) {
    return { success: false, error: "No forward-to email address configured" };
  }

  const { subject, text, html } = buildEnquiryEmailContent(enquiry, recipients.subjectPrefix);

  try {
    const transport = createTransport(smtp);
    await transport.sendMail({
      from: formatFromAddress(smtp),
      to: recipients.to.join(", "),
      cc: recipients.cc.length > 0 ? recipients.cc.join(", ") : undefined,
      bcc: recipients.bcc.length > 0 ? recipients.bcc.join(", ") : undefined,
      replyTo: enquiry.email,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error";
    console.warn("Enquiry email failed:", message);
    return { success: false, error: message };
  }
}

export async function sendTestEmail(recipient: string): Promise<{ success: true } | { success: false; error: string }> {
  const smtp = await getSmtpConfig();
  if (!smtp) {
    return {
      success: false,
      error: "SMTP is not configured or email sending is disabled. Save SMTP settings below or set SMTP_HOST and SMTP_FROM_EMAIL in environment variables.",
    };
  }

  if (!recipient.trim()) {
    return { success: false, error: "Test recipient email is required" };
  }

  try {
    const transport = createTransport(smtp);
    await transport.sendMail({
      from: formatFromAddress(smtp),
      to: recipient.trim(),
      replyTo: smtp.replyTo || undefined,
      subject: "Test email — Website SMTP configuration",
      text: "This is a test email from your infrastructure website admin panel. SMTP is configured correctly.",
      html: `<p>This is a test email from your infrastructure website admin panel.</p><p><strong>SMTP is configured correctly.</strong></p>`,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error";
    return { success: false, error: message };
  }
}
