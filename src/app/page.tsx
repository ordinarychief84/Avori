import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">Avori</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-zinc-700 hover:text-zinc-900">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mt-24 max-w-3xl">
        <h1 className="text-5xl font-bold leading-tight tracking-tight">
          Shoppable video for any storefront.
        </h1>
        <p className="mt-6 text-lg text-zinc-600">
          Upload short vertical videos, tag your products inside each frame, and drop a single
          embed snippet onto your site. Floating bubble, inline player, or full TikTok-style feed —
          your choice.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/signup" className="btn-primary">
            Create your brand
          </Link>
          <Link href="/login" className="btn-secondary">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-6 sm:grid-cols-3">
        {[
          ['Tag products in seconds', 'Click to drop a hotspot. Set when it appears, when it leaves.'],
          ['One-line embed', 'Paste one <script> tag and one <div>. Done. Inline, floating, or feed.'],
          ['Real analytics', 'Impressions, views, tag clicks, CTA clicks. Per video, per product.'],
        ].map(([title, body]) => (
          <div key={title} className="card p-6">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-zinc-600">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
