// Per-module setup guidance shown at the top of each dashboard module page.
// Keyed by the /dashboard/<segment> path segment. Steps are the honest,
// shortest path from empty module to live on the storefront.

export type GuideStep = { title: string; copy: string; href?: string; linkLabel?: string };

export type ModuleGuide = {
  name: string;
  intro: string;
  steps: GuideStep[];
  // Renders a copyable widget snippet with this data-mode.
  snippetMode?: 'floating' | 'gallery';
  // Hosted page URL template; {brandId} is substituted at render time.
  hostedPath?: string;
  apiNote?: string;
};

export const moduleGuides: Record<string, ModuleGuide> = {
  videos: {
    name: 'Shoppable Video',
    intro: 'Short vertical videos with tappable product tags, embedded on your store with one line of code.',
    steps: [
      { title: 'Have products in Avori', copy: 'Connect your store or add products so tags have something to point at.', href: '/dashboard/settings#integrations', linkLabel: 'Connect a store' },
      { title: 'Upload and tag', copy: 'Add a video above, then pin products to the frames where they appear.' },
      { title: 'Embed the player', copy: 'Paste the snippet below before </body>, or pick inline / feed modes on the Embed page.', href: '/dashboard/embed', linkLabel: 'All embed options' },
      { title: 'Watch the numbers', copy: 'Impressions, views, taps and attributed revenue land in Analytics per video.', href: '/dashboard/analytics', linkLabel: 'Open Analytics' },
    ],
    snippetMode: 'floating',
  },
  reviews: {
    name: 'Reviews',
    intro: 'Collect verified reviews on autopilot, moderate them in one queue, and publish social proof anywhere.',
    steps: [
      { title: 'Connect your orders', copy: 'Reviews are matched against real orders for the Verified badge, so connect a store or push orders via API first.', href: '/dashboard/settings#integrations', linkLabel: 'Connect a store' },
      { title: 'Tune collection', copy: 'Use Review settings above to set the post-purchase request delay and the auto-publish rating threshold.' },
      { title: 'Moderate', copy: 'New reviews arrive as pending unless auto-publish covers them. Approve, reply, or reject from the queue below.' },
      { title: 'Publish', copy: 'Star ratings and review lists render through the widget and the public JSON API.', href: '/dashboard/embed', linkLabel: 'Embed options' },
    ],
    apiNote: 'GET /api/public/brand/{brandId}/reviews?productId=… serves storefront JSON with the ratings breakdown.',
  },
  ugc: {
    name: 'UGC Gallery',
    intro: 'A curated, shoppable wall of customer photos and videos, fed automatically by approved reviews.',
    steps: [
      { title: 'Collect media', copy: 'Approve reviews that include photos or videos, then press Import from reviews above. You can also add media directly.' },
      { title: 'Curate and tag', copy: 'Approve what represents the brand, credit the customer, and tag the products in frame.' },
      { title: 'Embed the wall', copy: 'The gallery mode renders a shoppable grid with a lightbox. Paste the snippet below.' },
    ],
    snippetMode: 'gallery',
  },
  social: {
    name: 'Social Feed',
    intro: 'Bring Instagram and TikTok energy to your storefront as a shoppable, curated feed.',
    steps: [
      { title: 'Add posts', copy: 'Paste media URLs and captions above. Account sync can come later; curation works today.' },
      { title: 'Tag products', copy: 'Attach products so every post links to checkout.' },
      { title: 'Serve the feed', copy: 'Your storefront reads the gallery as JSON with resolved product cards.', href: '/docs', linkLabel: 'GET /api/v1/social' },
    ],
  },
  quizzes: {
    name: 'Quizzes',
    intro: 'Guided selling: weighted questions that end in a product recommendation and capture the lead.',
    steps: [
      { title: 'Build the quiz', copy: 'Create a quiz above, add questions, and weight each answer toward the products it should recommend.' },
      { title: 'Publish', copy: 'Publishing validates the quiz end to end so shoppers never hit a dead question.' },
      { title: 'Share it', copy: 'Every quiz gets a hosted page you can link anywhere, and the SDK opens it as a modal on your site.' },
      { title: 'Read the results', copy: 'Responses, recommendations and captured emails land under each quiz.' },
    ],
    hostedPath: '/q/{brandId}/your-quiz-slug',
  },
  surveys: {
    name: 'Surveys',
    intro: 'Post-purchase surveys and NPS, with AI summaries that turn a thousand answers into three decisions.',
    steps: [
      { title: 'Create a survey', copy: 'NPS or custom questions, assembled above in minutes.' },
      { title: 'Collect responses', copy: 'Trigger from email or your storefront through one endpoint.', href: '/docs', linkLabel: 'POST /api/v1/surveys/{id}/respond' },
      { title: 'Summarize with AI', copy: 'The AI summary reads every response and reports the themes worth acting on.' },
    ],
  },
  shade: {
    name: 'Shade Studio',
    intro: 'AI selfie analysis that matches shoppers to the right shades from your own catalog.',
    steps: [
      { title: 'Tag your products', copy: 'Give products shade metadata so recommendations come from your real catalog.', href: '/dashboard/products', linkLabel: 'Open Products' },
      { title: 'Share the hosted analyzer', copy: 'The hosted page below works on any phone with zero code, and the SDK opens it as a modal.' },
      { title: 'Collect the leads', copy: 'Shoppers who save results leave an email; profiles attach to customer records here.' },
    ],
    hostedPath: '/s/{brandId}',
  },
  loyalty: {
    name: 'Loyalty',
    intro: 'Points, tiers, cashback and birthday rewards that accrue automatically on every ingested order.',
    steps: [
      { title: 'Set the earn rules', copy: 'Points per currency unit, signup and review bonuses, birthday gifts and tier thresholds, all configured above.' },
      { title: 'Connect orders', copy: 'Every order from your connector or API earns points with zero manual work.', href: '/dashboard/settings#integrations', linkLabel: 'Connect a store' },
      { title: 'Let them redeem', copy: 'Rewards convert to discount codes and store credit your checkout validates via API.', href: '/docs', linkLabel: 'GET /api/v1/loyalty' },
    ],
  },
  referrals: {
    name: 'Referrals',
    intro: 'Customer, employee and influencer referral programs with two-sided rewards and fraud checks.',
    steps: [
      { title: 'Configure the program', copy: 'Set advocate and friend rewards above.' },
      { title: 'Issue links', copy: 'Create referral links per advocate; clicks are tracked server-side.' },
      { title: 'Rewards pay themselves', copy: 'Conversions match at order ingest, pass fraud checks, and pay out as store credit.' },
    ],
  },
  giftcards: {
    name: 'Gift Cards',
    intro: 'Issue, deliver and redeem gift cards backed by one credit ledger, on any platform.',
    steps: [
      { title: 'Issue a card', copy: 'Any amount, from the dashboard or the API.' },
      { title: 'Deliver the code', copy: 'Send it by email or print it into packaging.' },
      { title: 'Redeem at checkout', copy: 'One endpoint validates the code and debits the balance atomically.', href: '/docs', linkLabel: 'POST /api/v1/giftcards/redeem' },
    ],
  },
  discounts: {
    name: 'Discounts',
    intro: 'Codes with campaign windows and usage caps, validated through one endpoint on every platform.',
    steps: [
      { title: 'Create a campaign', copy: 'Value, schedule and usage limits above.' },
      { title: 'Share the code', copy: 'Email, social, influencers, packaging.' },
      { title: 'Validate at checkout', copy: 'Your cart calls one endpoint and every rule you set is enforced.', href: '/docs', linkLabel: 'POST /api/v1/discounts/validate' },
    ],
  },
  bundles: {
    name: 'Bundles',
    intro: 'Frequently Bought Together, Buy X Get Y, mix and match, and quantity breaks.',
    steps: [
      { title: 'Pick a bundle type', copy: 'Four mechanics cover nearly every average-order-value play.' },
      { title: 'Choose products and pricing', copy: 'Set roles and the discount logic once.' },
      { title: 'Serve offers', copy: 'The widget or your cart reads active bundles from the API.', href: '/docs', linkLabel: 'GET /api/v1/bundles' },
    ],
  },
  gifts: {
    name: 'Free Gifts',
    intro: 'Threshold gifts that give shoppers a concrete reason to add one more item.',
    steps: [
      { title: 'Set the threshold and gift', copy: 'Pick the product and the spend that unlocks it.' },
      { title: 'Check eligibility from the cart', copy: 'One call answers whether this cart earns the gift.', href: '/docs', linkLabel: 'POST /api/v1/gifts/eligible' },
      { title: 'Show the progress', copy: 'A "you are $11 away" nudge closes the gap; the widget and API expose it.' },
    ],
  },
  upsells: {
    name: 'Upsells',
    intro: 'The right offer at the right moment: product page, cart, checkout and post-purchase.',
    steps: [
      { title: 'Create the offer', copy: 'Pick the product, the discount and the pitch above.' },
      { title: 'Choose the placement', copy: 'Each placement carries its own offers and its own numbers.' },
      { title: 'Measure acceptance', copy: 'Impressions, accepts and attributed revenue per offer, in Analytics.', href: '/dashboard/analytics', linkLabel: 'Open Analytics' },
    ],
  },
};
