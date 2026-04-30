import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import EmbedSnippet from '@/components/EmbedSnippet';

export default async function EmbedPage() {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const [brand, installs] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.widgetInstall.findMany({
      where: { brandId },
      orderBy: { lastSeenAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Embed</h1>
      <p className="text-sm text-zinc-600">
        Paste this snippet anywhere on your website. The widget will load active videos for{' '}
        <span className="font-medium">{brand?.name}</span> and track impressions automatically.
      </p>

      <EmbedSnippet brandId={brandId} />

      <div className="card p-6">
        <h2 className="font-semibold">Detected installs</h2>
        {installs.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No installs detected yet. Once your widget loads on a page, it will appear here.
          </p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr>
                <th>Domain</th>
                <th>Mode</th>
                <th>First seen</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {installs.map((i) => (
                <tr key={i.id} className="border-t border-zinc-100">
                  <td className="py-2">{i.domain}</td>
                  <td>{i.mode}</td>
                  <td>{i.firstSeenAt.toISOString().slice(0, 10)}</td>
                  <td>{i.lastSeenAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
