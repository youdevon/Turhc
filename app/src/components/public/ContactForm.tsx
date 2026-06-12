"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { ALERT_MESSAGES } from "@/lib/alert-messages";
import { notifyError, notifySuccess } from "@/lib/notify";
import { ENQUIRY_TYPES } from "@/lib/enquiry-types";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [enquiryType, setEnquiryType] = useState("general");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "Failed");
      }
      notifySuccess(ALERT_MESSAGES.enquirySubmitted);
      form.reset();
      setEnquiryType("general");
    } catch (error) {
      const message =
        error instanceof Error && error.message !== "Failed"
          ? error.message
          : ALERT_MESSAGES.contactSubmitFailed;
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4">
      {/* Honeypot — hidden from users */}
      <input
        type="text"
        name="_hp_website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        aria-hidden="true"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          name="firstName"
          required
          placeholder="First name *"
          maxLength={100}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
        />
        <input
          name="lastName"
          required
          placeholder="Last name *"
          maxLength={100}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
        />
      </div>

      <input
        name="companyName"
        placeholder="Company / organisation (optional)"
        maxLength={200}
        className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address *"
          maxLength={254}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          maxLength={50}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
        />
      </div>

      <select
        name="enquiryType"
        required
        value={enquiryType}
        onChange={(e) => setEnquiryType(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
      >
        {ENQUIRY_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      <input
        name="subject"
        placeholder="Subject (optional)"
        maxLength={300}
        className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
      />

      {enquiryType === "tenders" && (
        <input
          name="relatedTenderRef"
          placeholder="Tender reference (optional)"
          maxLength={100}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
        />
      )}

      {enquiryType === "projects" && (
        <input
          name="relatedProjectRef"
          placeholder="Project reference (optional)"
          maxLength={100}
          className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
        />
      )}

      <textarea
        name="message"
        required
        rows={5}
        minLength={10}
        maxLength={10000}
        placeholder="Your message *"
        className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none resize-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {loading ? "Sending..." : "Send Enquiry"}
      </button>
    </form>
  );
}
