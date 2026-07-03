// Marketing-site content. Add customers, use cases, help articles and FAQ
// entries here, the pages render whatever is in these arrays.

export type CaseStudy = {
  slug: string;
  brand: string;
  industry: string;
  logoText: string;
  headline: string;
  quote: string;
  person: string;
  role: string;
  metrics: Array<{ value: string; label: string }>;
  modules: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: 'roxa-beauty',
    brand: 'Roxa Beauty',
    industry: 'Clean cosmetics',
    logoText: 'ROXA',
    headline: 'Replaced four apps and lifted AOV 32% in one quarter',
    quote:
      'We replaced four subscriptions the first week. Loyalty and reviews finally talk to the same customer record, that alone changed our email game.',
    person: 'Amara O.',
    role: 'Founder',
    metrics: [
      { value: '+32%', label: 'average order value' },
      { value: '4 apps', label: 'consolidated into Avori' },
      { value: '2.1×', label: 'repeat purchase rate' },
    ],
    modules: ['Reviews', 'Loyalty', 'Bundles', 'AI Assistant'],
  },
  {
    slug: 'lumiere',
    brand: 'Lumière',
    industry: 'Prestige skincare',
    logoText: 'LUMIÈRE',
    headline: 'The shade analyzer became their best-converting lead magnet',
    quote:
      'People share the shade analyzer like a quiz, and every result lands in the CRM with matched products attached. It converts 3× better than our old popup.',
    person: 'Camille R.',
    role: 'Ecommerce Lead',
    metrics: [
      { value: '3×', label: 'lead conversion vs popup' },
      { value: '11k', label: 'shade profiles in 60 days' },
      { value: '+24%', label: 'quiz-attributed revenue' },
    ],
    modules: ['AI Shade Analyzer', 'Quizzes', 'Klaviyo sync'],
  },
  {
    slug: 'glowlab',
    brand: 'Glowlab',
    industry: 'Headless DTC beauty',
    logoText: 'GLOWLAB',
    headline: 'Full headless integration in one afternoon',
    quote:
      'An API key, three endpoints, one webhook. The docs read like they were written by people who ship. Our Next.js storefront had reviews and loyalty live by dinner.',
    person: 'Dani M.',
    role: 'CTO',
    metrics: [
      { value: '1 day', label: 'to full integration' },
      { value: '99.9%', label: 'widget uptime' },
      { value: '16KB', label: 'embed bundle size' },
    ],
    modules: ['REST API', 'Webhooks', 'Widget SDK'],
  },
  {
    slug: 'mare-skin',
    brand: 'Maré Skin',
    industry: 'Ocean-derived skincare',
    logoText: 'MARÉ',
    headline: 'Shoppable video turned their UGC library into a sales channel',
    quote:
      'We had hundreds of creator videos doing nothing. Now the floating player runs on every product page and video-touched sessions convert 28% higher.',
    person: 'Inés F.',
    role: 'Head of Growth',
    metrics: [
      { value: '+28%', label: 'conversion on video sessions' },
      { value: '140+', label: 'videos live on site' },
      { value: '6.4%', label: 'video CTR' },
    ],
    modules: ['Shoppable Video', 'Social Feed', 'Analytics'],
  },
];

export type UseCase = {
  goal: string;
  description: string;
  modules: string[];
};

export const useCases: UseCase[] = [
  {
    goal: 'Increase conversion rate',
    description:
      'Reviews with verified badges, Q&A on product pages, and shoppable video give shoppers the proof they need at the moment of decision.',
    modules: ['Reviews & UGC', 'Shoppable Video', 'Q&A'],
  },
  {
    goal: 'Raise average order value',
    description:
      'Frequently-bought-together bundles, placement-targeted upsells and free-gift thresholds nudge every cart higher, and attribute the lift.',
    modules: ['Bundles', 'Upsells', 'Free Gifts', 'Discounts'],
  },
  {
    goal: 'Bring customers back',
    description:
      'Points, VIP tiers, birthday bonuses, store credit and fraud-checked referrals turn one-time buyers into repeat customers.',
    modules: ['Loyalty', 'Referrals', 'Gift Cards'],
  },
  {
    goal: 'Personalize the experience',
    description:
      'The AI shade analyzer and quiz funnels build a color profile per customer and recommend from your own catalog, saved to the CRM for campaigns.',
    modules: ['AI Shade Analyzer', 'Quizzes', 'Customers 360°'],
  },
  {
    goal: 'Understand what works',
    description:
      'One analytics board across every module, AI-generated insights, and an assistant that answers questions about your live store data.',
    modules: ['Analytics', 'AI Assistant', 'Surveys & NPS'],
  },
  {
    goal: 'Feed your marketing stack',
    description:
      'Orders, signups and reviews stream server-side into Google Analytics, Klaviyo, Meta and Attentive the moment they happen.',
    modules: ['GA4', 'Klaviyo', 'Meta CAPI', 'Attentive'],
  },
];

export type Plan = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  cta: string;
  highlight: boolean;
  features: string[];
};

export const plans: Plan[] = [
  {
    name: 'Starter',
    price: '$0',
    cadence: 'free forever',
    blurb: 'Everything you need to launch your first growth module.',
    cta: 'Start free',
    highlight: false,
    features: [
      'Up to 300 orders / month',
      '2 active modules',
      'Reviews & Q&A',
      'Widget SDK + REST API',
      '1 team seat',
      'Community support',
    ],
  },
  {
    name: 'Growth',
    price: '$79',
    cadence: 'per month',
    blurb: 'The full platform for growing brands. Most popular.',
    cta: 'Start 14-day trial',
    highlight: true,
    features: [
      'Up to 3,000 orders / month',
      'All modules included',
      'AI review summaries & insights',
      'AI Shade Analyzer (500 analyses/mo)',
      'Shopify & WooCommerce connectors',
      'Marketing destinations (GA4, Klaviyo, Meta, Attentive)',
      '5 team seats',
      'Email support',
    ],
  },
  {
    name: 'Scale',
    price: '$249',
    cadence: 'per month',
    blurb: 'For high-volume brands and headless builds.',
    cta: 'Talk to us',
    highlight: false,
    features: [
      'Unlimited orders',
      'All modules + AI Assistant',
      'Unlimited shade analyses',
      'Priority webhook throughput',
      'Unlimited team seats + RBAC',
      'Audit log export',
      'Dedicated support',
    ],
  },
];

export const pricingFaq: Array<{ q: string; a: string }> = [
  {
    q: 'Is everything really included during early access?',
    a: 'Yes. While Avori is in early access every workspace gets the full module set free. When billing turns on, you will get 30 days notice and can pick a plan, nothing is removed without warning.',
  },
  {
    q: 'Do I need a developer to install Avori?',
    a: 'No. Shopify and WooCommerce connect from Settings with keys, and widgets embed with one copy-paste line. A developer only helps if you want a fully headless build on the REST API.',
  },
  {
    q: 'What counts as an order?',
    a: 'Any order ingested into Avori, from a connector sync, a webhook, or a REST API call. Cancelled and refunded orders are excluded from your monthly count.',
  },
  {
    q: 'How do AI features get billed?',
    a: 'AI review summaries, survey summaries, insights and the assistant are included in plan limits. Shade analyses are metered per plan because each one runs a vision model.',
  },
  {
    q: 'Can I change plans or cancel anytime?',
    a: 'Yes, upgrades apply immediately, downgrades at the next cycle, and cancelling keeps your data exportable for 90 days.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Annual billing gets two months free (about 17% off). It will be selectable at checkout once billing launches.',
  },
];

export const productFaq: Array<{ q: string; a: string }> = [
  {
    q: 'Which platforms does Avori work with?',
    a: 'Shopify and WooCommerce have native connectors that sync products, customers and orders. BigCommerce, Magento and any custom storefront integrate through the REST API and the embeddable widget, if your site can run one script tag, it can run Avori.',
  },
  {
    q: 'How does the AI Shade Analyzer work?',
    a: 'A customer takes or uploads a selfie. Claude vision analyzes skin tone, undertone, lip tone, hair and eye color, then Avori matches products you have tagged with suitable tones. The profile is stored on the customer record for future campaigns.',
  },
  {
    q: 'Do all modules really share one customer database?',
    a: 'Yes, that is the core of the platform. A review, a quiz response, a loyalty balance and an order all attach to the same customer record, so segments and campaigns see the whole person.',
  },
  {
    q: 'Can I moderate reviews before they go live?',
    a: 'Every review lands in a moderation queue by default. You can also set an auto-publish threshold (for example, auto-approve 4–5 star reviews) and keep manual control of the rest.',
  },
  {
    q: 'How do loyalty points reach my checkout?',
    a: 'Customers redeem points for rewards, which generate one-time codes. Your storefront validates any code, reward, discount or gift card, through a single endpoint: POST /api/v1/discounts/validate.',
  },
  {
    q: 'Is my data isolated from other brands?',
    a: 'Every row is scoped to your workspace and every query filters on it. API keys are stored as SHA-256 hashes, webhooks are HMAC-signed, and sensitive actions land in an audit log.',
  },
  {
    q: 'Can I export my data?',
    a: 'Survey and quiz responses export to CSV today, and every resource is readable through the REST API, your data is never locked in.',
  },
];

export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  body: string[];
};

export const helpCategories = [
  'Getting started',
  'Integrations',
  'Modules',
  'Billing & account',
] as const;

export const helpArticles: HelpArticle[] = [
  {
    slug: 'quickstart',
    category: 'Getting started',
    title: 'Set up your workspace in 10 minutes',
    summary: 'Create your account, add products, and launch your first module.',
    body: [
      'Create your workspace at /signup, the first account becomes the Owner and can invite teammates later from Settings → Team.',
      'Add products under Commerce → Products (or connect Shopify/WooCommerce in Settings → Integrations and let the sync import them).',
      'Pick one module to launch first. Reviews is the fastest win: it starts collecting from post-purchase requests automatically once orders flow.',
      'Embed the widget on your site with the one-line snippet from Embed & SDK, then watch events arrive in Analytics.',
    ],
  },
  {
    slug: 'connect-shopify',
    category: 'Integrations',
    title: 'Connect Shopify',
    summary: 'OAuth install, what syncs, and how webhooks keep data fresh.',
    body: [
      'Go to Settings → Integrations → Shopify and enter your my-store.myshopify.com domain. You will be redirected to Shopify to approve read access to products, customers and orders.',
      'The first sync runs in the background right after you approve. Products arrive with a shopify-<id> SKU so re-syncs update instead of duplicate.',
      'New orders arrive via webhook in real time and flow through the same pipeline as every other source: loyalty points, referral conversion, review requests and analytics all fire automatically.',
      'Self-hosting note: Shopify OAuth requires SHOPIFY_API_KEY and SHOPIFY_API_SECRET from your Shopify Partner app in the server environment.',
    ],
  },
  {
    slug: 'connect-woocommerce',
    category: 'Integrations',
    title: 'Connect WooCommerce',
    summary: 'REST keys, webhook setup, and signature verification.',
    body: [
      'In WooCommerce, create REST keys under WooCommerce → Settings → Advanced → REST API (Read access is enough for sync).',
      'In Avori, open Settings → Integrations → WooCommerce → Connect, paste the store URL, consumer key and consumer secret. Avori validates the keys before saving and starts the first sync.',
      'For real-time orders, add a webhook in Woo (topic: Order created) pointing at the URL shown on the integration card, and set the same secret in both places, deliveries are verified with HMAC-SHA256.',
    ],
  },
  {
    slug: 'marketing-destinations',
    category: 'Integrations',
    title: 'Send events to Google, Klaviyo, Meta and Attentive',
    summary: 'Server-side event forwarding to your marketing stack.',
    body: [
      'Connect each destination in Settings → Marketing destinations. Klaviyo, Meta and Attentive credentials are verified live before saving; GA4 uses your Measurement ID plus a Measurement Protocol API secret.',
      'Once connected, Avori forwards purchases, signups and review events server-side, no extra pixels, no client-side scripts, and it works for API and connector orders alike.',
      'Events are fire-and-forget with per-destination isolation: one provider having an outage never blocks order ingestion or other destinations.',
    ],
  },
  {
    slug: 'shade-analyzer',
    category: 'Modules',
    title: 'Launch the AI Shade Analyzer',
    summary: 'Tag your catalog, test with a selfie, then put it on your site.',
    body: [
      'Tag products first: edit any product and set Shade tones (fair → rich) and Undertones (cool/neutral/warm/olive). Only tagged products are ever recommended.',
      'Test it in Shade Studio: use the camera or upload a photo, and you will get the full color profile plus matched products in a few seconds.',
      'On your storefront, call POST /api/v1/shade/analyze with a base64 image, or embed the widget flow. Every analysis stores a profile and, when an email is captured, attaches it to the customer record.',
    ],
  },
  {
    slug: 'reviews-moderation',
    category: 'Modules',
    title: 'Reviews: moderation, auto-publish and AI summaries',
    summary: 'Control what goes live and let AI do the reading.',
    body: [
      'All reviews land as Pending unless you set an auto-publish threshold in Reviews → Settings (e.g. auto-approve 4★ and up).',
      'Verified badges are automatic: if the reviewer’s email matches a customer who bought that product, the review is marked verified.',
      'Generate an AI summary from any product’s reviews, it is cached on the product and served through the public reviews endpoint for your widget.',
    ],
  },
  {
    slug: 'loyalty-setup',
    category: 'Modules',
    title: 'Loyalty: earn rates, tiers and redemptions',
    summary: 'Design the program and validate reward codes at checkout.',
    body: [
      'Configure earn rate (points per currency unit), signup/review/birthday bonuses, and VIP tiers with multipliers under Grow → Loyalty.',
      'Customers earn automatically on every paid order from any source. Tiers recalculate on lifetime points.',
      'Redemptions mint one-time codes. Your checkout validates any code type with POST /api/v1/discounts/validate, it answers for discount campaigns, reward codes and gift cards in one call.',
    ],
  },
  {
    slug: 'billing',
    category: 'Billing & account',
    title: 'Plans, billing and early access',
    summary: 'What is free now, and what happens when billing launches.',
    body: [
      'During early access every workspace has the full platform free. Your current plan shows in Settings → Plan & billing.',
      'When billing launches you will get 30 days notice inside the dashboard and by email, with plan selection at Settings → Plan & billing. See /pricing for plan details.',
      'Owners can manage the workspace, team, API keys and integrations; Managers run modules; Staff can moderate content.',
    ],
  },
  {
    slug: 'team-roles',
    category: 'Billing & account',
    title: 'Team roles and permissions',
    summary: 'Owner vs Manager vs Staff.',
    body: [
      'Owner: everything, including team management, API keys, webhooks and workspace settings. The first account in a workspace is the Owner.',
      'Manager: full module access, create campaigns, edit products, answer questions, view analytics.',
      'Staff: day-to-day moderation, approve reviews, answer Q&A, view content. Invite teammates from Settings → Team with a temporary password.',
    ],
  },
];
