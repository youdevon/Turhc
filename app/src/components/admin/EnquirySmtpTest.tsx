"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { sendEnquiryTestEmail } from "@/lib/enquiry-actions";

type Props = {
  defaultRecipient: string;
};

export function EnquirySmtpTest({ defaultRecipient }: Props) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    if (!recipient.trim()) {
      notifyError(ALERT_MESSAGES.smtpTestNoRecipient);
      return;
    }
    setLoading(true);
    try {
      await sendEnquiryTestEmail(recipient.trim());
      notifySuccess(ALERT_MESSAGES.smtpTestSent);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : ALERT_MESSAGES.actionFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border bg-background/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Send test email</h3>
        <p className="text-xs text-muted mt-1">
          Sends a test message using the SMTP settings above (or environment variables if CMS host/from are not set). Save settings first if you changed them.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="test@example.com"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleTest}
          disabled={loading}
          className="admin-btn-secondary shrink-0"
        >
          <Send />
          {loading ? "Sending…" : "Send test email"}
        </button>
      </div>
    </div>
  );
}
