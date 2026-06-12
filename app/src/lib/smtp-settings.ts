import type { SmtpConfig, SmtpEncryption } from "./mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SmtpFormValues = {
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpEncryption: SmtpEncryption;
  smtpUser: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpReplyTo: string;
};

export function parseSmtpEncryption(value: string | undefined | null): SmtpEncryption {
  if (value === "none" || value === "starttls" || value === "ssl") return value;
  return "starttls";
}

export function validateSmtpFormValues(values: SmtpFormValues, passwordConfigured: boolean, newPassword: string): string | null {
  if (!values.smtpEnabled) return null;

  if (!values.smtpHost.trim()) {
    return "SMTP host is required when email sending is enabled.";
  }

  const port = parseInt(values.smtpPort, 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return "SMTP port must be a number between 1 and 65535.";
  }

  if (!values.smtpFromEmail.trim()) {
    return "From email address is required when email sending is enabled.";
  }

  if (!EMAIL_RE.test(values.smtpFromEmail.trim())) {
    return "From email address is not valid.";
  }

  if (values.smtpReplyTo.trim() && !EMAIL_RE.test(values.smtpReplyTo.trim())) {
    return "Reply-to address is not valid.";
  }

  if (values.smtpUser.trim() && !newPassword.trim() && !passwordConfigured) {
    return "SMTP password is required when a username is set.";
  }

  return null;
}

export function buildTransportOptions(config: SmtpConfig) {
  const base = {
    host: config.host,
    port: config.port,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  };

  switch (config.encryption) {
    case "ssl":
      return { ...base, secure: true };
    case "starttls":
      return { ...base, secure: false, requireTLS: true };
    case "none":
    default:
      return { ...base, secure: false, ignoreTLS: true };
  }
}

export function formatFromAddress(config: SmtpConfig): string {
  const name = config.fromName?.trim() || "Website Notifications";
  return `"${name}" <${config.fromEmail}>`;
}
