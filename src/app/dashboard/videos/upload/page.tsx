'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';

export default function UploadVideoPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('DRAFT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const uploadVideo = async (file: File) => {
    setError(null);
    setProgress('Uploading…');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', 'video');
    const res = await fetch('/api/brand/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Upload failed');
      setProgress(null);
      return;
    }
    const j = await res.json();
    setVideoUrl(j.url);
    setProgress('Uploaded');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch('/api/brand/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || undefined,
        videoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        status,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? 'Save failed');
      return;
    }
    const j = await res.json();
    router.push(`/dashboard/videos/${j.video.id}`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Upload video</h1>
      <form onSubmit={onSubmit} className="card max-w-2xl space-y-5 p-6">
        <div>
          <label className="label">Video file (vertical, MP4/WebM/MOV)</label>
          <div className="mt-1 flex items-center gap-3">
            <label className="btn-secondary cursor-pointer">
              {videoUrl ? 'Replace file' : 'Choose file'}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadVideo(f);
                }}
              />
            </label>
            {progress && <span className="text-sm text-zinc-500">{progress}</span>}
          </div>
          <input
            className="input mt-2"
            placeholder="…or paste a video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          {videoUrl && (
            <video
              src={videoUrl}
              className="mt-3 max-h-64 w-auto rounded border border-zinc-200"
              controls
              muted
              playsInline
            />
          )}
        </div>

        <div>
          <label className="label">Title</label>
          <input
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Description (optional)</label>
          <textarea
            className="input mt-1 min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Thumbnail (optional)</label>
          <ImageUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
        </div>

        <div>
          <label className="label">Status</label>
          <select
            className="input mt-1"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'INACTIVE')}
          >
            <option value="DRAFT">Draft (only you can see)</option>
            <option value="ACTIVE">Active (visible in widget)</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={busy || !videoUrl || !title}>
            {busy ? 'Saving…' : 'Save & continue to tagging'}
          </button>
        </div>
      </form>
    </div>
  );
}
