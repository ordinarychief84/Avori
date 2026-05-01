'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileVideo, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, FormField } from '@/components/ui/Input';
import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import { PageHeader } from '@/components/AppShell';
import ImageUploader from '@/components/ImageUploader';

export default function UploadVideoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('DRAFT');
  const [progress, setProgress] = useState<'idle' | 'uploading' | 'uploaded'>('idle');
  const [busy, setBusy] = useState(false);

  const uploadVideo = async (file: File) => {
    setProgress('uploading');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', 'video');
    const res = await fetch('/api/brand/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error('Upload failed', { description: j.error });
      setProgress('idle');
      return;
    }
    const j = await res.json();
    setVideoUrl(j.url);
    setProgress('uploaded');
    toast.success('Video uploaded');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) uploadVideo(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.error('Save failed', { description: j.error });
      return;
    }
    const j = await res.json();
    toast.success('Video saved');
    router.push(`/dashboard/videos/${j.video.id}`);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upload video"
        description="Vertical 9:16 works best. MP4, WebM, or MOV up to 200MB."
      />
      <Card className="max-w-3xl">
        <form onSubmit={onSubmit}>
          <CardBody className="space-y-6">
            <FormField label="Video file" required>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-lg border border-dashed border-border bg-surface/50 p-6 text-center transition-colors hover:border-accent/40"
              >
                {progress === 'uploaded' ? (
                  <div className="space-y-3">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-fg">Uploaded successfully</p>
                    <video
                      src={videoUrl}
                      controls
                      muted
                      playsInline
                      className="mx-auto max-h-72 rounded-md border border-border"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      Replace file
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent-subtle text-accent">
                      <FileVideo className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg">
                        Drag & drop, or click to choose
                      </p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        Vertical 9:16 · MP4, WebM, MOV · ≤ 200MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      loading={progress === 'uploading'}
                      leftIcon={<Upload className="h-4 w-4" />}
                      onClick={() => fileRef.current?.click()}
                    >
                      Choose file
                    </Button>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadVideo(f);
                    e.target.value = '';
                  }}
                />
              </div>
              <Input
                placeholder="…or paste a video URL"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setProgress(e.target.value ? 'uploaded' : 'idle');
                }}
                className="mt-3"
              />
            </FormField>

            <FormField label="Title" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Spring drop · Iced Latte launch"
              />
            </FormField>
            <FormField label="Description" hint="Shown as a caption inside the widget.">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A dreamy iced-latte morning. Tap the dots to shop."
              />
            </FormField>
            <FormField label="Thumbnail" hint="Optional. We'll use the first frame if you skip this.">
              <ImageUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
            </FormField>
            <FormField label="Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'INACTIVE')}
              >
                <option value="DRAFT">Draft — only you can see this</option>
                <option value="ACTIVE">Active — appears in widget</option>
                <option value="INACTIVE">Inactive — hidden but kept</option>
              </Select>
            </FormField>
          </CardBody>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => router.push('/dashboard/videos')}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={busy}
              disabled={!videoUrl || !title}
            >
              Save & continue to tagging
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
