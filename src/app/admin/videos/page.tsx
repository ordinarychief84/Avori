import { prisma } from '@/lib/prisma';
import ToggleDisabled from '@/components/ToggleDisabled';

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: { brand: { select: { id: true, name: true } } },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Videos</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Disabled?</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">{v.title}</td>
                <td className="px-4 py-3 text-zinc-600">{v.brand.name}</td>
                <td className="px-4 py-3">{v.status.toLowerCase()}</td>
                <td className="px-4 py-3">{v.disabled ? 'yes' : 'no'}</td>
                <td className="px-4 py-3 text-right">
                  <ToggleDisabled
                    endpoint={`/api/admin/videos/${v.id}`}
                    disabled={v.disabled}
                    label={v.disabled ? 'Enable' : 'Disable'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
