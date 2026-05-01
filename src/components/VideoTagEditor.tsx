'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Tag as TagIcon, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FormField } from '@/components/ui/Input';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import RowDelete from '@/components/RowDelete';

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
      toast.error('Failed to create tag');
      return;
    }
    const j = await res.json();
    setVideo({ ...video, tags: [...video.tags, j.tag] });
    setPendingTag(null);
    toast.success('Tag added');
  };

  const updateTag = async (tagId: string, patch: Partial<Tag>) => {
    const res = await fetch(`/api/brand/videos/${video.id}/tags/${tagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error('Update failed');
      return;
    }
    const j = await res.json();
    setVideo({
      ...video,
      tags: video.tags.map((t) => (t.id === tagId ? { ...t, ...j.tag } : t)),
    });
  };

  const deleteTag = async (tagId: string) => {
    const res = await fetch(`/api/brand/videos/${video.id}/tags/${tagId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    setVideo({ ...video, tags: video.tags.filter((t) => t.id !== tagId) });
    toast.success('Tag removed');
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    const res = await fetch(`/api/brand/videos/${video.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    setSavingMeta(false);
    if (!res.ok) {
      toast.error('Save failed');
      return;
    }
    toast.success('Saved');
    router.refresh();
  };

  const visibleTags = video.tags.filter((t) => time >= t.startTime && time <= t.endTime);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard/videos"
            className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to videos
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{video.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={video.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {video.status.toLowerCase()}
            </Badge>
            <span className="text-xs text-fg-muted">{video.tags.length} tag(s)</span>
          </div>
        </div>
        <RowDelete
          endpoint={`/api/brand/videos/${video.id}`}
          confirm={`Delete "${video.title}" and all its tags?`}
          redirectTo="/dashboard/videos"
          label="Delete video"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div
            ref={stageRef}
            onClick={onStageClick}
            className="relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-lg border border-border bg-black"
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
                <div className="h-7 w-7 rounded-full border-2 border-white bg-accent shadow-glow" />
              </div>
            ))}
            {pendingTag && (
              <div
                style={{ left: `${pendingTag.x}%`, top: `${pendingTag.y}%` }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="h-7 w-7 animate-pulse rounded-full border-2 border-white bg-warning" />
              </div>
            )}
          </div>
          <p className="text-center text-xs text-fg-subtle">
            Click anywhere on the player to drop a hotspot. Current time:{' '}
            <span className="font-mono text-fg-muted">{time.toFixed(2)}s</span>
          </p>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video details</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <FormField label="Title">
                <Input
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                />
              </FormField>
              <FormField label="Description">
                <Textarea
                  value={meta.description}
                  onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                />
              </FormField>
              <FormField label="Status">
                <Select
                  value={meta.status}
                  onChange={(e) =>
                    setMeta({ ...meta, status: e.target.value as VideoT['status'] })
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </FormField>
              <Button
                size="sm"
                variant="secondary"
                loading={savingMeta}
                leftIcon={<Save className="h-3.5 w-3.5" />}
                onClick={saveMeta}
                className="w-full"
              >
                Save details
              </Button>
            </CardBody>
          </Card>

          {pendingTag && (
            <Card>
              <CardHeader>
                <CardTitle>Pick a product</CardTitle>
                <p className="mt-1 text-xs text-fg-muted">
                  Hotspot at ({pendingTag.x.toFixed(1)}, {pendingTag.y.toFixed(1)}). Default 5s
                  window from {Math.max(0, time - 0.5).toFixed(2)}s.
                </p>
              </CardHeader>
              <CardBody className="space-y-2">
                {products.length === 0 ? (
                  <p className="text-sm text-fg-muted">
                    No active products. Add some on the Products page.
                  </p>
                ) : (
                  products.map((p) => (
                    <button
                      key={p.id}
                      className="flex w-full items-center gap-3 rounded-md border border-border bg-bg/40 p-2 text-left transition-colors hover:border-border-strong"
                      onClick={() => createTag(p.id)}
                    >
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-9 w-9 rounded-md object-cover ring-1 ring-border"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-fg">{p.name}</div>
                        <div className="text-xs text-fg-muted">${p.price.toFixed(2)}</div>
                      </div>
                    </button>
                  ))
                )}
                <button
                  className="text-xs text-fg-subtle hover:text-fg"
                  onClick={() => setPendingTag(null)}
                >
                  Cancel
                </button>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tags · {video.tags.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              {video.tags.length === 0 ? (
                <p className="text-sm text-fg-muted">
                  No tags yet. Click the player to drop your first hotspot.
                </p>
              ) : (
                <ul className="space-y-3">
                  {video.tags.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-md border border-border bg-bg/40 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={t.product.imageUrl}
                          className="h-9 w-9 rounded-md object-cover ring-1 ring-border"
                          alt=""
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-fg">{t.product.name}</div>
                          <div className="text-xs text-fg-muted">
                            @ ({t.x.toFixed(1)}, {t.y.toFixed(1)})
                          </div>
                        </div>
                        <button
                          className="rounded-md p-1.5 text-fg-muted hover:bg-surface hover:text-danger"
                          onClick={() => deleteTag(t.id)}
                          aria-label="Delete tag"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="block text-2xs uppercase tracking-wide text-fg-subtle">
                          Start (s)
                          <Input
                            className="mt-1"
                            type="number"
                            step="0.1"
                            defaultValue={t.startTime}
                            onBlur={(e) => updateTag(t.id, { startTime: Number(e.target.value) })}
                          />
                        </label>
                        <label className="block text-2xs uppercase tracking-wide text-fg-subtle">
                          End (s)
                          <Input
                            className="mt-1"
                            type="number"
                            step="0.1"
                            defaultValue={t.endTime}
                            onBlur={(e) => updateTag(t.id, { endTime: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                      <button
                        className="mt-2 text-2xs uppercase tracking-wide text-accent hover:text-accent-hover"
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
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
