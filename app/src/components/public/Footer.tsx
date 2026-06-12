import Link from "next/link";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

type Props = {
  orgName: string;
  logoUrl?: string | null;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
};

export function Footer({ orgName, logoUrl, footerText, contactEmail, contactPhone, contactAddress }: Props) {
  return (
    <footer
      className="bg-theme-footer border-t blueprint-grid"
      style={{ borderColor: "var(--footer-border)", color: "var(--footer-text)" }}
    >
      <div className="container-wide section-padding !py-10 sm:!py-12 md:!py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`${orgName} logo`}
                  className="h-10 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              <span className="font-semibold">{orgName}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--footer-text-muted)" }}>
              {footerText}
            </p>
          </div>

          <div>
            <h4 className="public-footer-heading">Quick Links</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--footer-text-muted)" }}>
              {[
                { href: "/projects", label: "Projects" },
                { href: "/tenders", label: "Tenders" },
                { href: "/governance", label: "Governance" },
                { href: "/news", label: "News & Notices" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="public-footer-heading">Contractors</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--footer-text-muted)" }}>
              {[
                { href: "/contractors/registration", label: "Registration" },
                { href: "/contractors/prequalification", label: "Prequalification" },
                { href: "/contractors/how-to-bid", label: "How to Submit Bids" },
                { href: "/contractors/faqs", label: "FAQs" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="public-footer-heading">Contact</h4>
            <ul className="space-y-3 text-sm" style={{ color: "var(--footer-text-muted)" }}>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span>{contactAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <a href={`tel:${contactPhone}`} className="hover:text-primary transition-colors">
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors">
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
          style={{ borderColor: "var(--footer-border)", color: "var(--footer-text-muted)" }}
        >
          <p>&copy; {new Date().getFullYear()} {orgName}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
            <Link href="/governance/freedom-of-information" className="hover:text-primary transition-colors">
              Freedom of Information
            </Link>
            <Link href="/governance/procurement-policies" className="hover:text-primary transition-colors">
              Procurement Policies
            </Link>
            <Link href="/admin/login" className="opacity-60 hover:opacity-100 hover:text-primary transition-all text-xs">
              Staff login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
