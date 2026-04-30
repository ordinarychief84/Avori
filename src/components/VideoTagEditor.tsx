'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteButton from './DeleteButton';

type Product = { id: string; name: string; imageUrl: string; price: number };
type Tag = {
  id: string;
  productId: string;
  x: number;
  y: number;
  startTime: number;
  endTime: number;
  product: { id: string; name: string; imageUrl: string };
};
type VideoT = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  tags: Tag[];
};

export default function VideoTagEditor({
  video: initial,
  products,
}: {
  video: VideoT;
  products: Product[];
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [video, setVideo] = useState(initial);
  const [time, setTime] = useState(0);
  const [pendingTag, setPendingTag] = useState<{ x: number; y: number } | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [meta, setMeta] = useState({
    title: initial.title,
    description: initial.description,
    status: initial.status,
  });

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, []);

  const onStageClick = (e: React.MouseEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingTag({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  };

  const createTag = async (productId: string) => {
    if (!pendingTag) return;
    const start = Math.max(0, time - 0.5);
    const end = start + 5;
    const res = await fetch(`/api/brand/videos/${video.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        x: pendingTag.x,
        y: pendingTag.y,
        startTime: +start.toFixed(2),
        endTime: +end.toFixed(2),
      }),
    });
    if (!res.ok) {
      alert('Failed to create tag');
      return;
    }
    const j = await res.json();
    setVideo({ ...video, tags: [...video.tags, j.tag] });
    setPendingTag(null);
  };

  const updateTag = async (tagId: string, patch: Partial<Tag>) => {
    const res = await fetch(`/api/brand/videos/${video.id}/tags/${tagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const j = await res.json();
    setVideo({
      ...video,
      tags: video.tags.map((t) => (t.id === tagId ? { ...t, ...j.tag } : t)),
    });
  };

  const deleteTag = async (tagId: string) => {
    const res = await fetch(`/api/brand/videos/${video.id}/tags/${tagId}`, { method: 'DELETE' });
    if (!res.ok) return;
    setVideo({ ...video, tags: video.tags.filter((t) => t.id !== tagId) });
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    await fetch(`/api/brand/videos/${video.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    setSavingMeta(false);
    router.refresh();
  };

  const visibleTags = video.tags.filter((t) => time >= t.startTime && time <= t.endTime);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">{video.title}</h1>
          <DeleteButton
            endpoint={`/api/brand/videos/${video.id}`}
            confirm="Delete this video and all its tags?"
            redirectTo="/dashboard/videos"
          />
        </div>

        <div
          ref={stageRef}
          onClick={onStageClick}
          className="relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-lg bg-black"
        >
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="absolute inset-0 h-full w-full object-contain"
            controls
            playsInline
            muted
          />
          {visibleTags.map((t) => (
            <div
              key={t.id}
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            >
              <div className="h-7 w-7 rounded-full border-2 border-white bg-brand-500/80 shadow-[0_0_0_4px_rgba(124,58,237,0.25)]" />
            </div>
          ))}
          {pendingTag && (
            <div
              style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            >
              <div className="h-7 w-7 animate-pulse rounded-full border-2 border-white bg-amber-400" />
            </div>
          )}
        </div>
        <p className="text-center text-xs text-zinc-500">
          Click anywhere on the video to drop a hotspot, then pick a product. Current time:{' '}
          <span className="font-mono">{time.toFixed(2)}s</span>
        </p>
      </div>

      <aside className="space-y-6">
        <div className="card p-4">
          <h3 className="font-semibold">Video details</h3>
          <div className="mt-3 space-y-3">
            <input
              className="input"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
            <textarea
              className="input min-h-[80px]"
              placeholder="Description"
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
            />
            <select
              className="input"
              value={meta.status}
              onChange={(e) =>
                setMeta({ ...meta, status: e.target.value as VideoT['status'] })
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button className="btn-secondary w-full" onClick={saveMeta} disabled={savingMeta}>
              {savingMeta ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </div>

        {pendingTag && (
          <div className="card p-4">
            <h3 className="font-semibold">Pick a product</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Hotspot at ({pendingTag.x.toFixed(1)}, {pendingTag.y.toFixed(1)}) · 5s window from{' '}
              {Math.max(0, time - 0.5).toFixed(2)}s
            </p>
            <div className="mt-3 max-h-72 space-y-2 overflow-auto">
              {products.length === 0 && (
                <p className="text-sm text-zinc-500">
                  No active products yet. Add some on the Products page.
                </p>
              )}
              {products.map((p) => (
                <button
                  key={p.id}
                  className="flex w-full items-center gap-3 rounded-md border border-zinc-200 p-2 text-left hover:bg-zinc-50"
                  onClick={() => createTag(p.id)}
                >
                  <img src={p.imageUrl} className="h-10 w-10 rounded object-cover" alt="" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-zinc-500">${p.price.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              className="mt-3 text-xs text-zinc-500 hover:underline"
              onClick={() => setPendingTag(null)}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="card p-4">
          <h3 className="font-semibold">Tags ({video.tags.length})</h3>
          {video.tags.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No tags yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {video.tags.map((t) => (
                <li key={t.id} className="rounded-md border border-zinc-200 p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.product.imageUrl}
                      className="h-9 w-9 rounded object-cover"
                      alt=""
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.product.name}</div>
                      <div className="text-xs text-zinc-500">
                        @ ({t.x.toFixed(1)}, {t.y.toFixed(1)})
                      </div>
                    </div>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => deleteTag(t.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <label>
                      <span className="block text-zinc-500">Start (s)</span>
                      <input
                        className="input mt-1"
                        type="number"
                        step="0.1"
                        defaultValue={t.startTime}
                        onBlur={(e) => updateTag(t.id, { startTime: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      <span className="block text-zinc-500">End (s)</span>
                      <input
                        className="input mt-1"
                        type="number"
                        step="0.1"
                        defaultValue={t.endTime}
                        onBlur={(e) => updateTag(t.id, { endTime: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <button
                    className="mt-2 text-xs text-brand-600 hover:underline"
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = t.startTime;
                    }}
                  >
                    Jump to {t.startTime.toFixed(1)}s
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
