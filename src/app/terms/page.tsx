import type { Metadata } from 'next';
import { MarketingHeader, MarketingFooter, PageHero } from '@/components/marketing/SiteChrome';

export const metadata: Metadata = {
  title: 'Terms of Service | Avori',
  description: 'The terms that govern use of the Avori platform.',
};

const SECTIONS: Array<{ h: string; p: string[] }> = [
  {
    h: 'The service',
    p: [
      'Avori provides ecommerce experience tools: reviews, shoppable video, AI shade analysis, quizzes, surveys, loyalty, referrals, gift cards, bundles, upsells, analytics and related APIs.',
      'During early access all modules are included free. Paid plans, when introduced, will be announced 30 days in advance.',
    ],
  },
  {
    h: 'Your responsibilities',
    p: [
      'Keep your credentials and API keys secret. Actions taken with your keys are your actions.',
      'Only upload content you have the right to use, and only send marketing to customers who have consented under the laws that apply to you.',
      'Do not attempt to access other workspaces, probe the service for vulnerabilities, or use the platform for unlawful products.',
    ],
  },
  {
    h: 'Your data',
    p: [
      'You own your store data. Export it any time through the dashboard and the REST API.',
      'You grant Avori the limited rights needed to operate the service on your behalf, as described in the Privacy Policy.',
    ],
  },
  {
    h: 'AI features',
    p: [
      'AI outputs (summaries, insights, shade analyses) are generated automatically and can be imperfect. Review them before relying on them for business decisions.',
    ],
  },
  {
    h: 'Availability and liability',
    p: [
      'The service is provided as-is during early access. We work hard on uptime but do not yet offer an SLA.',
      'To the maximum extent permitted by law, Avori’s liability is limited to the amounts you paid in the twelve months before a claim.',
    ],
  },
  {
    h: 'Changes and contact',
    p: [
      'We may update these terms; material changes will be announced in the dashboard.',
      'Questions: hello@avori.com.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <MarketingHeader />
      <main>
        <PageHero eyebrow="Legal" title="Terms of Service" sub="Last updated July 2026." />
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
