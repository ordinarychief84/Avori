// One entry per engineered module. Copy is grounded in shipped capabilities:
// if a bullet names a behavior, the backend actually does it.

export type Solution = {
  slug: string;
  name: string;
  category: 'Customer trust' | 'AI personalization' | 'Average order value' | 'Retention' | 'Intelligence';
  headline: string;
  sub: string;
  features: { title: string; copy: string }[];
  steps: { title: string; copy: string }[];
  apiNote: string;
  cta: string;
};

export const solutions: Solution[] = [
  {
    slug: 'reviews',
    name: 'Reviews',
    category: 'Customer trust',
    headline: 'Reviews that carry real proof',
    sub: 'Collect text, photo and video reviews on autopilot, moderate them in one queue, and publish social proof that matches how your customers actually shop.',
    features: [
      { title: 'Verified purchase badges', copy: 'Every review is checked against real orders, so the badge means what shoppers think it means.' },
      { title: 'Photo and video reviews', copy: 'Customers attach media in one tap; approved photos also feed your UGC Gallery automatically.' },
      { title: 'Q&A on product pages', copy: 'Shoppers ask, you answer once, and the published answer keeps selling around the clock.' },
      { title: 'AI review summaries', copy: 'Claude condenses hundreds of reviews into one shopper-ready paragraph, refreshed as reviews arrive.' },
    ],
    steps: [
      { title: 'Collect', copy: 'Post-purchase review requests go out on your schedule, matched to real orders.' },
      { title: 'Moderate', copy: 'Approve from one queue, or set an auto-publish rating threshold and let it run.' },
      { title: 'Publish', copy: 'Star ratings, galleries and summaries render in the widget or your own UI via API.' },
    ],
    apiNote: 'POST /api/v1/reviews to ingest, GET /api/public/brand/{id}/reviews for storefront JSON with the ratings breakdown included.',
    cta: 'Turn customer voices into conversion',
  },
  {
    slug: 'ugc-gallery',
    name: 'UGC Gallery',
    category: 'Customer trust',
    headline: 'A shoppable wall of real customers',
    sub: 'Photos and videos from approved reviews flow into one curated gallery. Tag products, credit the customer, and publish a wall that sells.',
    features: [
      { title: 'Auto-collection', copy: 'Approved review media lands in the gallery as pending. Nothing ships to your storefront without your yes.' },
      { title: 'Product tagging', copy: 'Every tile can carry shop-this-look products with live names, prices and links.' },
      { title: 'Moderation and credit', copy: 'Approve, hide, and credit the customer by name or handle from one grid.' },
      { title: 'One-line embed', copy: 'data-mode="gallery" renders the wall with a shoppable lightbox; the SDK serves JSON for custom builds.' },
    ],
    steps: [
      { title: 'Approve reviews', copy: 'Media from approved reviews queues itself for curation automatically.' },
      { title: 'Curate and tag', copy: 'Pick what represents the brand, tag the products in frame, credit the creator.' },
      { title: 'Embed', copy: 'One line of code publishes the wall anywhere your store lives.' },
    ],
    apiNote: 'Embed with data-mode="gallery", or read GET /api/v1/ugc and /api/public/brand/{id}/ugc as JSON with resolved product cards.',
    cta: 'Put your customers on the homepage',
  },
  {
    slug: 'shoppable-video',
    name: 'Shoppable Video',
    category: 'Customer trust',
    headline: 'TikTok-style video that sells on your site',
    sub: 'Upload short vertical videos, tag products frame by frame, and embed players that turn watch time into checkout time.',
    features: [
      { title: 'Frame-accurate product tags', copy: 'Hotspots appear exactly when the product does and open a card with price and a Shop button.' },
      { title: 'Three players', copy: 'Inline, floating bubble, and a full-screen feed. Each is one line of code and theme-aware.' },
      { title: 'AI try-on', copy: 'Beauty products open a camera try-on straight from the product card.' },
      { title: 'Revenue tracking', copy: 'Impressions, views, taps and purchases are tracked per video, so winners are obvious.' },
    ],
    steps: [
      { title: 'Upload and tag', copy: 'Drop a vertical video and pin products to the frames where they appear.' },
      { title: 'Choose a placement', copy: 'Homepage feed, product page inline, or a floating bubble that follows the shopper.' },
      { title: 'Read the revenue column', copy: 'Every video reports views and attributed orders in the dashboard.' },
    ],
    apiNote: 'Public feed JSON at /api/public/brand/{id}/videos honors product page targeting via ?productId.',
    cta: 'Give your best content a checkout button',
  },
  {
    slug: 'social-feed',
    name: 'Social Feed',
    category: 'Customer trust',
    headline: 'Your social proof, on your storefront',
    sub: 'Bring Instagram and TikTok energy to product pages with a curated, shoppable social wall you control.',
    features: [
      { title: 'Curated feed', copy: 'Add posts manually today, connect account sync when you are ready. You choose what shows.' },
      { title: 'Product tagging', copy: 'Attach products to any post so the feed links straight to checkout.' },
      { title: 'Visibility control', copy: 'Show or hide any post in one click without deleting it.' },
      { title: 'API-first', copy: 'The same feed serves your headless build as clean JSON.' },
    ],
    steps: [
      { title: 'Add posts', copy: 'Paste media and captions, or pull from your accounts.' },
      { title: 'Tag products', copy: 'Link each post to the products it features.' },
      { title: 'Publish the wall', copy: 'The gallery renders on your storefront and stays in sync.' },
    ],
    apiNote: 'GET /api/v1/social returns the gallery with resolved product cards.',
    cta: 'Make the feed shoppable',
  },
  {
    slug: 'shade-analyzer',
    name: 'AI Shade Analyzer',
    category: 'AI personalization',
    headline: 'A selfie is all it takes to match a shade',
    sub: 'Claude vision reads undertone and depth from one photo, then recommends the exact products that fit, before the shopper bounces to guesswork.',
    features: [
      { title: 'Real computer vision', copy: 'Undertone, depth and seasonal palette from a single selfie, analyzed by Claude.' },
      { title: 'Instant product matches', copy: 'Recommendations come from your own catalog, ranked by fit for that face.' },
      { title: 'Email capture built in', copy: 'Not ready to buy? Their matches land in their inbox and a lead lands in your dashboard.' },
      { title: 'Hosted page included', copy: 'Share /s/your-brand anywhere: no code, no theme edits, camera-ready.' },
    ],
    steps: [
      { title: 'Shopper snaps a selfie', copy: 'On the hosted page, in the SDK modal, or through your own UI via API.' },
      { title: 'AI returns the profile', copy: 'Undertone, depth, season, and the products from your catalog that match.' },
      { title: 'Shop now or save', copy: 'Buy immediately or leave an email and get the matches delivered.' },
    ],
    apiNote: 'POST /api/v1/shade/analyze for custom builds; the hosted page and SDK modal need zero code.',
    cta: 'End shade-guessing at checkout',
  },
  {
    slug: 'quizzes',
    name: 'Quizzes',
    category: 'AI personalization',
    headline: 'Guided selling that ends in a product',
    sub: 'Weighted, branching quizzes that recommend from your catalog first and ask for the email second.',
    features: [
      { title: 'Weighted scoring', copy: 'Every answer votes for products. The best match wins and leads the results page.' },
      { title: 'Branching logic', copy: 'Answers can route shoppers down different question paths.' },
      { title: 'Recommendations first', copy: 'Shoppers see their match with a Shop now button before any email ask.' },
      { title: 'Lead capture that converts', copy: 'Skippers leave an email and get their matches delivered, becoming a warm lead.' },
    ],
    steps: [
      { title: 'Build', copy: 'Write questions, weight the answers toward products, publish when valid.' },
      { title: 'Share', copy: 'Use the hosted quiz page or open it from the SDK in a modal.' },
      { title: 'Read the results', copy: 'Responses, recommendations and captured leads all land in the dashboard.' },
    ],
    apiNote: 'Hosted at /q/{brand}/{slug}; submit headlessly via POST /api/v1/quizzes/{slug}.',
    cta: 'Ask three questions, sell the right product',
  },
  {
    slug: 'surveys',
    name: 'Surveys',
    category: 'Intelligence',
    headline: 'Ask customers, let AI read the answers',
    sub: 'Post-purchase surveys and NPS with AI summaries, so a thousand responses become three decisions.',
    features: [
      { title: 'NPS and custom surveys', copy: 'Score questions, multiple choice and free text, assembled in minutes.' },
      { title: 'AI response summaries', copy: 'Claude reads every response and reports the themes that matter.' },
      { title: 'CSV export', copy: 'Take the raw responses anywhere your analysis lives.' },
      { title: 'API submissions', copy: 'Trigger surveys from email, storefront, or app through one endpoint.' },
    ],
    steps: [
      { title: 'Create', copy: 'Pick NPS or custom questions and publish.' },
      { title: 'Collect', copy: 'Responses arrive from any channel through the API.' },
      { title: 'Summarize', copy: 'AI turns the pile into themes; you turn themes into changes.' },
    ],
    apiNote: 'POST /api/v1/surveys/{id}/respond from email, storefront or app.',
    cta: 'Hear the signal, skip the noise',
  },
  {
    slug: 'loyalty',
    name: 'Loyalty Program',
    category: 'Retention',
    headline: 'Points your customers actually use',
    sub: 'Reward every order, signup, review and birthday automatically, with tiers that grow spend and redemptions shoppers understand.',
    features: [
      { title: 'Earn on autopilot', copy: 'Orders, signups, reviews and birthdays award points with zero manual work.' },
      { title: 'Tiers', copy: 'Spend thresholds unlock higher earn rates and perks for your best customers.' },
      { title: 'Rewards catalog', copy: 'Points redeem for the discounts and store credit you define.' },
      { title: 'Works everywhere', copy: 'Loyalty follows the customer across Shopify, WooCommerce and custom builds through one API.' },
    ],
    steps: [
      { title: 'Set earn rules', copy: 'Points per dollar, signup bonus, review bonus, birthday gift.' },
      { title: 'Customers accumulate', copy: 'Every ingested order earns automatically, whatever the platform.' },
      { title: 'Redeem', copy: 'Rewards convert to value at checkout through the API.' },
    ],
    apiNote: 'GET and POST /api/v1/loyalty covers balances and redemptions in any stack.',
    cta: 'Make the second order automatic',
  },
  {
    slug: 'cashback',
    name: 'Cashback',
    category: 'Retention',
    headline: 'Cashback that stays in your store',
    sub: 'A percentage of every paid order comes back as store credit, the refund-proof reward that keeps revenue in your ecosystem.',
    features: [
      { title: 'Automatic accrual', copy: 'Paid orders trigger cashback instantly. No coupons, no claims, no forms.' },
      { title: 'Tier-based rates', copy: 'VIP tiers can earn a higher percentage than first-time buyers.' },
      { title: 'Store credit, not cash', copy: 'Rewards spend at your store instead of leaving it.' },
      { title: 'Full ledger', copy: 'Every accrual is visible on the customer record with its source order.' },
    ],
    steps: [
      { title: 'Set the rate', copy: 'One percentage, or different rates per loyalty tier.' },
      { title: 'Orders accrue', copy: 'Credit posts the moment an order ingests from any connector.' },
      { title: 'Customers return', copy: 'The balance nudges the next purchase to happen with you.' },
    ],
    apiNote: 'Cashback posts to the store credit ledger at order ingest, from any connector or API order.',
    cta: 'Reward spend without discounting your brand',
  },
  {
    slug: 'store-credit',
    name: 'Store Credit',
    category: 'Retention',
    headline: 'The wallet built into your store',
    sub: 'One ledger for refunds, cashback, gift cards and goodwill, spendable at checkout and visible on every customer record.',
    features: [
      { title: 'Refund to credit', copy: 'Turn refunds into retained revenue in one click from the order view.' },
      { title: 'Every source, one balance', copy: 'Cashback, referral rewards, gift cards and manual adjustments share a ledger.' },
      { title: 'Full audit trail', copy: 'Every transaction records who, why and how much.' },
      { title: 'API-spendable', copy: 'Check and debit balances from any checkout flow.' },
    ],
    steps: [
      { title: 'Credit accrues', copy: 'Refunds, cashback and rewards feed the wallet automatically.' },
      { title: 'Balance surfaces', copy: 'The customer profile shows the live balance and history.' },
      { title: 'Spend at checkout', copy: 'Your checkout debits credit through the API before charging the card.' },
    ],
    apiNote: 'Balances and adjustments ride the /api/v1 customer endpoints; refunds convert from the order view.',
    cta: 'Keep refund money in the family',
  },
  {
    slug: 'gift-cards',
    name: 'Gift Cards',
    category: 'Retention',
    headline: 'Gift cards that work on every platform',
    sub: 'Issue, deliver and redeem gift cards with codes that clear through one API, whatever the storefront.',
    features: [
      { title: 'One-click issuing', copy: 'Create cards for campaigns, service recovery, or sale as products.' },
      { title: 'Secure codes', copy: 'Unique codes with live balance checks behind a single ledger.' },
      { title: 'Redemption API', copy: 'One endpoint validates the code and debits the balance atomically.' },
      { title: 'Balance visibility', copy: 'Merchants and customers can always see what a card is worth.' },
    ],
    steps: [
      { title: 'Issue', copy: 'From the dashboard or the API, in any amount.' },
      { title: 'Deliver', copy: 'Send the code by email or print it into packaging.' },
      { title: 'Redeem', copy: 'Checkout calls one endpoint and the value applies.' },
    ],
    apiNote: 'POST /api/v1/giftcards/redeem clears codes and debits the balance atomically.',
    cta: 'Sell money, earn loyalty',
  },
  {
    slug: 'referrals',
    name: 'Referrals',
    category: 'Retention',
    headline: 'Customers, employees and creators, all referring',
    sub: 'Three referral programs in one: unique links, two-sided rewards, conversion tracking and fraud checks baked in.',
    features: [
      { title: 'Three advocate types', copy: 'Customer, employee and influencer programs run side by side with separate terms.' },
      { title: 'Two-sided rewards', copy: 'The advocate earns and the friend saves, both configured by you.' },
      { title: 'Fraud checks', copy: 'Self-referrals and suspicious patterns get flagged before rewards pay out.' },
      { title: 'Attribution', copy: 'Clicks and conversions tie to real orders automatically at ingest.' },
    ],
    steps: [
      { title: 'Issue links', copy: 'Every advocate gets a unique, trackable link.' },
      { title: 'Track', copy: 'Clicks record server-side; conversions match at order time.' },
      { title: 'Reward', copy: 'Store credit pays out automatically once the order sticks.' },
    ],
    apiNote: 'POST /api/v1/referrals/track records clicks server-side; conversion happens at order ingest.',
    cta: 'Turn your fans into a channel',
  },
  {
    slug: 'bundles',
    name: 'Bundles',
    category: 'Average order value',
    headline: 'Four bundle types, one goal: bigger carts',
    sub: 'Frequently Bought Together, Buy X Get Y, mix and match, and quantity breaks, all configured in minutes.',
    features: [
      { title: 'Frequently Bought Together', copy: 'Pair products that sell together and price the pair to move.' },
      { title: 'Buy X Get Y', copy: 'Purchases unlock discounted or free companion products.' },
      { title: 'Mix and match', copy: 'Shoppers build their own set from a pool you define.' },
      { title: 'Quantity discounts', copy: 'Price breaks kick in as the quantity climbs.' },
    ],
    steps: [
      { title: 'Pick a type', copy: 'Four mechanics cover nearly every AOV play.' },
      { title: 'Choose products and pricing', copy: 'Set the discount logic once.' },
      { title: 'Serve', copy: 'The widget or your checkout reads active bundles from the API.' },
    ],
    apiNote: 'GET /api/v1/bundles returns active offers for your cart logic.',
    cta: 'Raise the average order, not the ad spend',
  },
  {
    slug: 'upsells',
    name: 'Upsells',
    category: 'Average order value',
    headline: 'The right offer at the right moment',
    sub: 'Product page, cart and post-purchase placements with attribution, so you know which offer earns its slot.',
    features: [
      { title: 'Four placements', copy: 'Product page, cart, checkout and post-purchase, each with its own offers.' },
      { title: 'Targeting', copy: 'Attach offers to specific products or cart conditions.' },
      { title: 'Attribution', copy: 'Accepted upsells tie revenue back to the exact offer that earned it.' },
      { title: 'API-served', copy: 'Render offers natively in any stack from one endpoint.' },
    ],
    steps: [
      { title: 'Create the offer', copy: 'Pick the product, the discount and the pitch.' },
      { title: 'Place it', copy: 'Choose where in the journey the offer appears.' },
      { title: 'Measure', copy: 'Impressions, accepts and attributed revenue per offer.' },
    ],
    apiNote: 'GET and POST /api/v1/upsells serves offers and records outcomes.',
    cta: 'Ask for the bigger cart, politely',
  },
  {
    slug: 'free-gifts',
    name: 'Free Gifts',
    category: 'Average order value',
    headline: 'Gifts that unlock bigger carts',
    sub: 'Threshold-based free gifts that give shoppers a concrete reason to add one more item.',
    features: [
      { title: 'Spend thresholds', copy: 'Carts over the line earn the gift automatically.' },
      { title: 'Progress messaging', copy: 'Show how close the cart is, and watch it close the gap.' },
      { title: 'Eligibility API', copy: 'One call at cart time answers: does this cart earn the gift?' },
      { title: 'Campaign windows', copy: 'Run gifts for a weekend or a season with start and end dates.' },
    ],
    steps: [
      { title: 'Set threshold and gift', copy: 'Pick the product and the spend that unlocks it.' },
      { title: 'Cart checks eligibility', copy: 'Your cart calls the API as items change.' },
      { title: 'Gift applies', copy: 'The unlocked gift lands in the cart and the AOV climbs.' },
    ],
    apiNote: 'POST /api/v1/gifts/eligible answers in one round trip at cart time.',
    cta: 'Give a little, sell a lot',
  },
  {
    slug: 'discounts',
    name: 'Discounts',
    category: 'Average order value',
    headline: 'Discount campaigns with guardrails',
    sub: 'Codes, campaign windows and validation through one endpoint, so promos stay controlled on every platform.',
    features: [
      { title: 'Campaigns and codes', copy: 'Percentage or fixed value, scoped to a campaign with dates.' },
      { title: 'Usage limits', copy: 'Caps keep a viral code from becoming a margin event.' },
      { title: 'Validation API', copy: 'One call returns eligibility and value for any code.' },
      { title: 'Cross-platform', copy: 'The same code validates on Shopify, WooCommerce or headless.' },
    ],
    steps: [
      { title: 'Create the campaign', copy: 'Value, window, limits.' },
      { title: 'Share the code', copy: 'Email, social, packaging, influencers.' },
      { title: 'Validate at checkout', copy: 'The endpoint enforces every rule you set.' },
    ],
    apiNote: 'POST /api/v1/discounts/validate returns eligibility and value in one call.',
    cta: 'Promos without the leak',
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    category: 'Intelligence',
    headline: 'Every module reports to one dashboard',
    sub: 'Impressions, views, quiz completions, upsell accepts and orders flow through one event pipeline with revenue attribution.',
    features: [
      { title: 'Unified events', copy: 'Widgets, hosted pages and your API calls all feed the same pipeline.' },
      { title: 'Revenue attribution', copy: 'Orders credit the module that earned them, so budgets follow results.' },
      { title: 'Per-module dashboards', copy: 'Reviews, videos, quizzes, upsells and loyalty each report their own numbers.' },
      { title: 'Send anywhere', copy: 'Forward events to GA4, Klaviyo, Meta and Attentive automatically.' },
    ],
    steps: [
      { title: 'Events collect', copy: 'The widget and SDK report automatically; servers use one endpoint.' },
      { title: 'Dashboards aggregate', copy: 'Live views across every module without stitching tools.' },
      { title: 'Destinations receive', copy: 'Your ad and email platforms get the same truth.' },
    ],
    apiNote: 'POST /api/v1/events for custom tracking; the widget and SDK report automatically.',
    cta: 'Know which pixel earned the order',
  },
  {
    slug: 'ai-assistant',
    name: 'AI Assistant',
    category: 'Intelligence',
    headline: 'A merchant analyst on call',
    sub: 'Ask questions about your store in plain language, get insight digests, and let AI summarize reviews and surveys.',
    features: [
      { title: 'Chat with your data', copy: 'Ask about sales, reviews or customers and get grounded answers.' },
      { title: 'Insight digests', copy: 'Scheduled AI insights surface what changed and what to do about it.' },
      { title: 'Summaries everywhere', copy: 'Reviews and surveys come pre-read, with themes extracted.' },
      { title: 'Powered by Claude', copy: 'Anthropic models under the hood, and every AI feature degrades gracefully if disabled.' },
    ],
    steps: [
      { title: 'Open the assistant', copy: 'It already knows your store context.' },
      { title: 'Ask', copy: 'Plain language in, specific answers out.' },
      { title: 'Act', copy: 'Digests and summaries point at the next move.' },
    ],
    apiNote: 'Summaries also surface inside Reviews and Surveys; the assistant lives in your dashboard.',
    cta: 'Hire the analyst that never sleeps',
  },
];

export function getSolution(slug: string): Solution | undefined {
  return solutions.find((s) => s.slug === slug);
}

export function relatedSolutions(slug: string): Solution[] {
  const current = getSolution(slug);
  if (!current) return [];
  return solutions.filter((s) => s.category === current.category && s.slug !== slug);
}
