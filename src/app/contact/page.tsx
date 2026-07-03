import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, LifeBuoy, Code2 } from 'lucide-react';
import { MarketingHeader, MarketingFooter, PageHero } from '@/components/marketing/SiteChrome';
import ContactForm from '@/components/marketing/ContactForm';

export const metadata: Metadata = {
  title: 'Contact | Avori',
  description: 'Talk to the Avori team about sales, support or partnerships.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero
          eyebrow="Contact"
          title={
            <>
              Talk to a human.
              <br />
              <span className="text-gradient-brand">We answer fast.</span>
            </>
          }
          sub="Questions about plans, a migration from your current stack, or a headless build, send it over."
        />
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            {[
              {
                icon: Mail,
                title: 'Sales & general',
                body: 'Pricing, demos, migrations and partnerships, use the form and pick a topic.',
              },
              {
                icon: LifeBuoy,
                title: 'Support',
                body: (
                  <>
                    Check the{' '}
                    <Link href="/help" className="font-semibold text-accent hover:text-accent-hover">
                      Help Center
                    </Link>{' '}
                    first, setup guides for every module and connector live there.
                  </>
                ),
              },
              {
                icon: Code2,
                title: 'Developers',
                body: (
                  <>
                    API keys, webhooks and the widget SDK are documented in the{' '}
                    <Link href="/docs" className="font-semibold text-accent hover:text-accent-hover">
                      Developer Hub
                    </Link>
                    .
                  </>
                ),
              },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 rounded-xl border border-border bg-surface p-5 shadow-soft">
                <c.icon className="h-5 w-5 shrink-0 text-accent" />
                <div>
                  <h3 className="text-sm font-semibold text-fg">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
          <ContactForm />
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
