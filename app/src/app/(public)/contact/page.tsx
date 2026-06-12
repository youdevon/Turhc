import { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { ContactForm } from "@/components/public/ContactForm";
import { getPageHeroBySlug } from "@/lib/page-hero";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const [settings, hero] = await Promise.all([getSiteSettings(), getPageHeroBySlug("contact")]);

  return (
    <>
      <PageHero {...hero} />
      <section className="section-padding blueprint-grid">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="border border-border bg-surface-elevated p-6 sm:p-8 relative">
              <ContactForm />
            </div>
            <div className="space-y-6">
              <div className="border border-border bg-surface-elevated p-6 flex gap-4">
                <MapPin className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <h3 className="public-panel-heading mb-1">Address</h3>
                  <p className="public-body-sm">{settings.contactAddress}</p>
                </div>
              </div>
              <div className="border border-border bg-surface-elevated p-6 flex gap-4">
                <Phone className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <h3 className="public-panel-heading mb-1">Phone</h3>
                  <a href={`tel:${settings.contactPhone}`} className="public-body-sm hover:text-primary">
                    {settings.contactPhone}
                  </a>
                </div>
              </div>
              <div className="border border-border bg-surface-elevated p-6 flex gap-4">
                <Mail className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <h3 className="public-panel-heading mb-1">Email</h3>
                  <a href={`mailto:${settings.contactEmail}`} className="public-body-sm hover:text-primary">
                    {settings.contactEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
