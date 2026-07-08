import type { Metadata } from 'next';
import { MarketingHeader, MarketingFooter, PageHero } from '@/components/marketing/SiteChrome';

export const metadata: Metadata = {
  title: 'Privacy Policy | Avori',
  description:
    'How Avori collects, uses, shares and protects personal data, and the rights you have under the GDPR.',
};

const SECTIONS: Array<{ h: string; p: string[] }> = [
  {
    h: '1. Who we are and what this policy covers',
    p: [
      'Avori ("Avori", "we", "us") provides an ecommerce growth platform: reviews, shoppable video, UGC galleries, quizzes, AI shade analysis, loyalty, referrals, bundles, upsells and analytics, delivered through a merchant dashboard, storefront widgets and APIs.',
      'This policy explains how we process personal data when you visit our websites, create a merchant account, or interact with Avori-powered features on a merchant’s store. It is written to meet the requirements of the EU and UK General Data Protection Regulation (GDPR).',
      'Two roles matter throughout: for merchant account data we act as the data controller. For shopper data that merchants collect through Avori (reviews, loyalty balances, quiz answers, shade profiles, order history), the merchant is the controller and Avori processes that data on the merchant’s documented instructions as a processor under Article 28 GDPR.',
    ],
  },
  {
    h: '2. Personal data we collect',
    p: [
      'Merchant account data: name, email address, password (stored only as a bcrypt hash), workspace name and domain, team member emails and roles, and the date you accepted our terms.',
      'Store data merchants bring to the platform: product catalogs, customer records, orders, reviews and review media, questions and answers, quiz and survey responses, loyalty and store credit ledgers, referral activity and gift card records.',
      'Shade analysis photos: a selfie submitted to the AI Shade Analyzer is transmitted to our AI provider to produce a color profile (skin tone, undertone, seasonal palette). The photo itself is not stored by Avori; only the resulting profile is, and only against the merchant workspace it was created in.',
      'Usage and technical data: analytics events fired by storefront widgets (impressions, views, clicks, quiz completions), the domain a widget loads on, IP-derived request metadata used for rate limiting and abuse prevention, and audit log entries recording sensitive dashboard actions.',
      'Cookies: we use a strictly necessary session cookie to keep merchants signed in. Our marketing site sets no advertising or cross-site tracking cookies.',
    ],
  },
  {
    h: '3. Legal bases for processing (Article 6 GDPR)',
    p: [
      'Performance of a contract: operating your workspace, syncing your store, running the modules you enable, and providing support.',
      'Consent: creating an account (you accept our terms with an affirmative checkbox, and we record when), and any shopper email captured through quiz, shade or review flows where the shopper actively submits it. Consent can be withdrawn at any time.',
      'Legitimate interests: securing the platform (rate limiting, fraud checks on referrals, audit logging), improving reliability, and defending legal claims. We balance these interests against your rights and use the least data necessary.',
      'Legal obligation: retaining records where tax, accounting or other laws require it.',
    ],
  },
  {
    h: '4. How we use personal data',
    p: [
      'To operate the platform: moderation queues, loyalty balances, referral attribution, analytics dashboards and the other features merchants turn on.',
      'To power AI features (review summaries, survey summaries, insights, the assistant, shade analysis) through our AI provider, Anthropic. Content is processed for the requesting workspace only and is not used to train shared models.',
      'To forward events to marketing destinations a merchant explicitly connects (Google Analytics 4, Klaviyo, Meta, Attentive). Nothing is shared with any destination a merchant has not connected themselves.',
      'We do not sell personal data, and we do not use shopper data for our own advertising.',
    ],
  },
  {
    h: '5. Processor commitments to merchants',
    p: [
      'For shopper data we process on your behalf, we: process it only to provide the services you configure; keep it isolated to your workspace with tenant-scoped queries; assist you in responding to data subject requests; notify you without undue delay after becoming aware of a personal data breach affecting your data; and delete or return it when you close your workspace.',
      'Merchants remain responsible for having a lawful basis for the shopper data they collect, for their own storefront privacy notices, and for honoring shopper requests. Avori provides deletion and export tooling to support this.',
    ],
  },
  {
    h: '6. Sharing and subprocessors',
    p: [
      'We share personal data only with the service providers needed to run Avori: Vercel (application hosting, USA), Supabase (managed PostgreSQL database, USA), and Anthropic (AI processing, USA). Each is bound by data processing terms.',
      'Merchants may additionally connect their own platforms and destinations (Shopify, WooCommerce, Magento, BigCommerce, GA4, Klaviyo, Meta, Attentive); data flows to those services only when the merchant connects them and can be disconnected at any time in Settings.',
      'We may disclose data where required by law or to protect the rights, safety and security of Avori, our merchants or the public.',
    ],
  },
  {
    h: '7. International transfers',
    p: [
      'Where personal data of EU/UK residents is transferred outside the EEA or UK (our subprocessors are US-based), we rely on the European Commission’s Standard Contractual Clauses and equivalent UK safeguards with each provider, alongside technical measures such as encryption in transit and at rest.',
    ],
  },
  {
    h: '8. Retention',
    p: [
      'Merchant account and store data is retained while the workspace is active. Records deleted in the dashboard are removed from the live database immediately.',
      'When a workspace is closed, we delete its data within 30 days, except where a longer period is required by law (for example invoicing records) or needed to resolve disputes.',
      'Shade analysis photos are not retained at all; only the derived profile is stored, and it is deleted with the workspace or on request.',
    ],
  },
  {
    h: '9. Your rights (Articles 15–21 GDPR)',
    p: [
      'You have the right to access the personal data we hold about you, to rectify inaccurate data, to erasure ("right to be forgotten"), to restrict or object to processing, to data portability in a machine-readable format, and to withdraw consent at any time without affecting prior processing.',
      'Merchants can exercise most of these directly in the dashboard: edit workspace and profile data in Settings, delete customers, reviews and other records inline, and export responses as CSV. For anything else, contact us and we will respond within one month as the GDPR requires.',
      'Shoppers should direct requests to the merchant who operates the store they interacted with (the controller); we assist that merchant in fulfilling the request. If you contact us directly we will forward the request and confirm.',
      'You also have the right to lodge a complaint with your local supervisory authority (in the EU, your national data protection authority; in the UK, the ICO).',
    ],
  },
  {
    h: '10. Security',
    p: [
      'Every record is scoped to a workspace and every query enforces that scope. Passwords are stored as bcrypt hashes and API keys as SHA-256 hashes, shown once at creation.',
      'Data is encrypted in transit (TLS, with HSTS enforced) and at rest by our database provider. Outbound webhooks are HMAC-signed; inbound platform webhooks are signature-verified. Uploads are validated by content, not filename. Role-based access control limits what team members can do, and sensitive actions are recorded in an audit log merchants can review in Settings.',
      'In the event of a personal data breach we will notify the competent supervisory authority within 72 hours where required by Article 33 GDPR, and affected merchants without undue delay.',
    ],
  },
  {
    h: '11. Children',
    p: [
      'Avori is a business tool and is not directed at children. We do not knowingly process data of anyone under 16; if you believe a child has provided us data, contact us and we will delete it.',
    ],
  },
  {
    h: '12. Changes and contact',
    p: [
      'We will post any changes to this policy here and update the date below. Material changes will be announced to merchants by email or in the dashboard before they take effect.',
      'Data protection contact: use the contact form at /contact or email hello@avori.com. Please include "Privacy" in the subject so we can route it quickly.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="marketing-canvas min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero eyebrow="Legal" title="Privacy Policy" sub="Last updated July 6, 2026." />
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
