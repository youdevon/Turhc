/**
 * Standard user-facing alert copy.
 * Format: [Action result]. [Optional next step.]
 */
export const ALERT_MESSAGES = {
  // Auth
  loginSuccess: "Signed in successfully.",
  loginInvalid: "Invalid email or password. Check your details and try again.",

  // Draft / publish workflow
  draftSaved: "Draft saved.",
  published: "Changes published. They are now live on the website.",
  draftDiscarded: "Draft discarded. The published version was kept.",

  // CRUD — content
  documentCreated: "Document created.",
  documentUpdated: "Document updated.",
  tenderCreated: "Tender created.",
  tenderUpdated: "Tender updated.",
  newsCreated: "News article created.",
  newsUpdated: "News article updated.",
  slideCreated: "Slide created.",
  slideUpdated: "Slide updated.",
  settingsSaved: "Settings saved. Refresh the public site to see changes.",

  // Users
  userCreated: "User account created.",
  userUpdated: "User account updated.",
  userDeleted: (name: string) => `${name} was deleted.`,
  passwordReset: (name: string) => `Password reset for ${name}.`,

  // Enquiries
  enquirySubmitted:
    "Enquiry submitted. We will respond to you shortly.",
  enquiryDeleted: "Enquiry deleted. It can be restored from the Deleted filter.",
  enquiryRestored: "Enquiry restored.",
  enquiryStatusUpdated: "Enquiry status updated.",
  enquiryNotesSaved: "Internal notes saved.",
  enquiryDeleteFailed: "Could not delete enquiry. Please try again.",
  enquiryRestoreFailed: "Could not restore enquiry. Please try again.",
  enquiryActionFailed: "Action failed. Please try again.",

  // Media
  logoUploaded: "Logo uploaded.",
  mediaUploaded: (name: string) => `${name} uploaded.`,
  mediaBatchUploaded: (count: number) =>
    `${count} file${count === 1 ? "" : "s"} uploaded.`,
  mediaDetailsSaved: "Media details saved.",
  mediaDeleted: (name: string) => `${name} deleted from the library.`,
  mediaUrlCopied: "URL copied to clipboard.",
  mediaSelectFromLibrary: (name: string) => `Using "${name}".`,
  duplicateRemoved: (name: string) => `Duplicate "${name}" removed.`,
  metadataRebuilt: (updated: number, missing: number) =>
    missing > 0
      ? `Updated ${updated} file${updated === 1 ? "" : "s"}. ${missing} missing on disk.`
      : `Updated ${updated} file${updated === 1 ? "" : "s"}.`,

  // Clipboard
  emailCopied: "Email copied to clipboard.",

  // Email / SMTP
  smtpTestSent: "Test email sent successfully.",
  smtpTestNoRecipient: "Enter a test recipient email address.",

  // Generic errors
  saveFailed: "Could not save your changes. Please try again.",
  settingsSaveFailed: "Could not save settings. Please try again.",
  uploadFailed: "Upload failed. Please try again.",
  uploadImageOnly: "Please choose an image file (PNG, JPG, SVG, or WebP).",
  copyFailed: "Could not copy to clipboard.",
  loadFailed: "Could not load this section. Please try again.",
  actionFailed: "Action failed. Please try again.",
  deleteFailed: "Could not complete deletion. Please try again.",
  contactSubmitFailed:
    "We could not submit your enquiry. Please try again or contact us directly.",

  // Confirmations
  confirmDelete: (label: string) => ({
    title: `Delete ${label}?`,
    description: "This cannot be undone.",
    confirmLabel: "Delete",
  }),
  confirmDeleteRestorable: {
    title: "Delete this enquiry?",
    description:
      "This removes the enquiry from your admin inbox. It can be restored later from the Deleted filter.",
    confirmLabel: "Delete enquiry",
  },
  confirmDeleteMedia: (name: string) => ({
    title: `Delete "${name}"?`,
    description:
      "This removes the file from the media library. Files still used on the site cannot be deleted.",
    confirmLabel: "Delete file",
  }),
  confirmRemoveMissingMedia: (name: string) => ({
    title: `Remove missing file "${name}"?`,
    description:
      "The file is no longer on the server but is still linked in the CMS. This removes the library entry and clears those broken links. Documents and tender files must be updated separately.",
    confirmLabel: "Remove entry and clear links",
    variant: "warning" as const,
  }),
  confirmDeleteUser: (name: string) => ({
    title: `Delete ${name}?`,
    description:
      "Their account will be permanently removed and cannot be restored.",
    confirmLabel: "Delete user",
  }),
  confirmRemoveDuplicate: (name: string) => ({
    title: `Remove duplicate "${name}"?`,
    description: "This removes the duplicate file from the library.",
    confirmLabel: "Remove duplicate",
  }),
  confirmPublish: {
    title: "Publish these changes?",
    description: "This will update the public website.",
    confirmLabel: "Publish",
  },
  confirmDiscardDraft: {
    title: "Discard draft changes?",
    description: "The published version will be kept.",
    confirmLabel: "Discard draft",
  },
} as const;
