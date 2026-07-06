import type { Metadata } from 'next';
import { MarketingHeader, MarketingFooter, PageHero } from '@/components/marketing/SiteChrome';

export const metadata: Metadata = {
  title: 'Privacy Policy | Avori',
  description: 'How Avori collects, uses and protects data.',
};

const SECTIONS: Array<{ h: string; p: string[] }> = [
  {
    h: 'What we collect',
    p: [
      'Account data: your name, email and workspace details when you create an account.',
      'Store data you bring to the platform: products, orders, customers, reviews, quiz and survey responses, and analytics events from your storefront.',
      'Photos submitted to the AI Shade Analyzer are processed to produce a color profile. The photo itself is not stored; only the resulting profile is.',
    ],
  },
  {
    h: 'How we use it',
    p: [
      'To operate the platform: moderation queues, loyalty balances, referral attribution, analytics and the other features you turn on.',
      'To power AI features (review summaries, insights, shade analysis) through our AI provider. Content is processed for your workspace only and never used to train shared models.',
      'To forward events to marketing destinations you explicitly connect (Google Analytics, Klaviyo, Meta, Attentive). Nothing is shared with third parties you have not connected.',
    ],
  },
  {
    h: 'Your shoppers',
    p: [
      'You are the controller of your customers’ data; Avori processes it on your behalf.',
      'Shopper emails are used for the features you run (review requests, loyalty, referrals) and are never sold or used for advertising by Avori.',
    ],
  },
  {
    h: 'Security',
    p: [
      'Every record is scoped to your workspace and every query enforces that scope.',
      'API keys are stored as SHA-256 hashes. Webhooks are HMAC-signed. Sensitive actions are recorded in an audit log you can review in Settings.',
    ],
  },
  {
    h: 'Retention and deletion',
    p: [
      'Data stays as long as your workspace is active. Delete a record in the dashboard and it is removed from the live database immediately.',
      'To delete an entire workspace, contact us and we will remove it within 30 days.',
    ],
  },
  {
    h: 'Contact',
    p: ['Questions about privacy: use the contact form or email hello@avori.com.'],
  },
];

export default function PrivacyPage() {
  return (
    <div className="dark-canvas min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero eyebrow="Legal" title="Privacy Policy" sub="Last updated July 2026." />
        <section className="mx-auto max-w-3xl space-y-8 px-6 py-14">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="text-lg font-bold tracking-tight">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
