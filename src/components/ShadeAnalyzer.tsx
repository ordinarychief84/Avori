'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Check,
  ImageUp,
  Mail,
  RefreshCw,
  ScanFace,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

type Analysis = {
  skinTone: string;
  undertone: string;
  lipTone: string;
  hairColor: string;
  eyeColor: string;
  season: string;
  notes: string;
};

type Recommendation = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  tryOnEnabled: boolean;
  tryOnTint: string | null;
};

type Step = 'capture' | 'preview' | 'analyzing' | 'results';

const MAX_EDGE = 1024;

// Downscale to keep the request small and strip EXIF. Returns raw base64
// (no data: prefix) plus the media type actually encoded.
async function toJpegBase64(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return { base64: dataUrl.split(',')[1], dataUrl, mediaType: 'image/jpeg' as const };
}

// Selfie shade analyzer. The flow sells first and captures second: analyze,
// show matched products with a buy path immediately, then offer email
// capture for shoppers who are not ready to buy.
export default function ShadeAnalyzer({
  aiEnabled,
  analyzeEndpoint = '/api/brand/shade/analyze',
  claimEndpoint,
  brandId,
}: {
  aiEnabled: boolean;
  analyzeEndpoint?: string;
  claimEndpoint?: string;
  brandId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('capture');
  const [photo, setPhoto] = useState<{ base64: string; dataUrl: string; mediaType: string } | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [intake, setIntake] = useState({ skinType: '', finish: '' });
  const [email, setEmail] = useState('');
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };
  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error('Camera unavailable. Check browser permissions, or upload a photo instead.');
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const shot = await toJpegBase64(video, video.videoWidth, video.videoHeight);
    stopCamera();
    setPhoto(shot);
    setStep('preview');
  };

  const onFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Could not read image'));
        img.src = url;
      });
      const shot = await toJpegBase64(img, img.naturalWidth, img.naturalHeight);
      stopCamera();
      setPhoto(shot);
      setStep('preview');
    } catch {
      toast.error('Could not read that image.');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const analyze = async () => {
    if (!photo) return;
    setStep('analyzing');
    try {
      const res = await fetch(analyzeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photo.base64,
          mediaType: photo.mediaType,
          ...(intake.skinType || intake.finish
            ? {
                intake: {
                  ...(intake.skinType ? { skinType: intake.skinType } : {}),
                  ...(intake.finish ? { finish: intake.finish } : {}),
                },
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Analysis failed');
      setAnalysis(data.analysis);
      setRecommendations(data.recommendations ?? []);
      setProfileId(data.profileId ?? null);
      setStep('results');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed');
      setStep('preview');
    }
  };

  const shopClick = (productId: string) => {
    if (!brandId) return;
    void fetch('/api/public/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, productId, type: 'CTA_CLICK' }),
    }).catch(() => {});
  };

  const claim = async () => {
    if (!claimEndpoint || !profileId || !email.trim()) return;
    setClaiming(true);
    const res = await fetch(claimEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, email: email.trim() }),
    });
    setClaiming(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? 'Could not save your email');
      return;
    }
    setClaimed(true);
  };

  const reset = () => {
    stopCamera();
    setPhoto(null);
    setAnalysis(null);
    setRecommendations([]);
    setProfileId(null);
    setEmail('');
    setClaimed(false);
    setStep('capture');
  };

  const attributes: { label: string; value: string | undefined }[] = analysis
    ? [
        { label: 'Skin tone', value: analysis.skinTone },
        { label: 'Undertone', value: analysis.undertone },
        { label: 'Lip tone', value: analysis.lipTone },
        { label: 'Hair', value: analysis.hairColor },
        { label: 'Eyes', value: analysis.eyeColor },
        { label: 'Season', value: analysis.season },
      ]
    : [];

  /* -------------------------------------------------- results (own layout) */
  if (step === 'results' && analysis) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
            <Sparkles className="h-5 w-5 text-accent" />
            {recommendations.length > 0 ? 'Your matches' : 'Your color profile'}
          </h3>
          <Button size="sm" variant="ghost" onClick={reset} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Analyze another photo
          </Button>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 6).map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-surface shadow-card',
                  i === 0 ? 'border-accent' : 'border-border'
                )}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.name} className="aspect-square w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-white">
                      Top match
                    </span>
                  )}
                  {p.tryOnEnabled && (
                    <span className="absolute right-3 top-3">
                      <Badge tone="accent">try-on</Badge>
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-fg">{p.name}</span>
                    <span className="shrink-0 text-sm text-fg-muted">${p.price.toFixed(2)}</span>
                  </div>
                  <a href={p.productUrl} target="_blank" rel="noreferrer" onClick={() => shopClick(p.id)}>
                    <Button className="w-full" size="sm" leftIcon={<ShoppingBag className="h-4 w-4" />}>
                      Shop now
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-sm text-fg-muted">
              No catalog matches yet. Tag shade tones and undertones on your products to power
              recommendations.
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {attributes.map((a) => (
                <div key={a.label} className="rounded-md border border-border bg-surface-2/40 px-3 py-2">
                  <div className="text-2xs uppercase tracking-[0.15em] text-fg-subtle">{a.label}</div>
                  <div className="mt-0.5 text-sm font-medium capitalize text-fg">{a.value || 'n/a'}</div>
                </div>
              ))}
            </div>
            {analysis.notes && <p className="text-sm text-fg-muted">{analysis.notes}</p>}
          </CardBody>
        </Card>

        {claimEndpoint && !claimed && (
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Mail className="h-4 w-4 text-accent" />
              Not ready to buy? We&apos;ll email your shade profile and matches.
            </div>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void claim();
              }}
            >
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" loading={claiming} variant="secondary">
                Email my matches
              </Button>
            </form>
          </div>
        )}
        {claimed && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-success/40 bg-success/5 p-4 text-sm font-medium text-fg">
            <Check className="h-4 w-4 text-success" />
            Saved. Your matches are on their way to {email}.
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------- capture / preview / analyze */
  return (
    <Card className="overflow-hidden border-accent/25">
      <CardBody className="p-0">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          {/* Left: capture surface */}
          <div className="relative flex min-h-[320px] items-center justify-center bg-fg/[0.03] p-6">
            {cameraOn ? (
              <div className="relative w-full max-w-sm overflow-hidden rounded-xl ring-1 ring-border">
                <video ref={videoRef} playsInline muted className="w-full -scale-x-100" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-3/4 w-2/3 rounded-[45%] border-2 border-dashed border-white/60" />
                </div>
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                  <Button onClick={captureFrame} leftIcon={<ScanFace className="h-4 w-4" />}>
                    Capture
                  </Button>
                  <Button variant="secondary" onClick={stopCamera} leftIcon={<X className="h-4 w-4" />}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : photo ? (
              <div className="relative w-full max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.dataUrl}
                  alt="Selfie to analyze"
                  className={cn(
                    'w-full rounded-xl object-cover ring-1 ring-border',
                    step === 'analyzing' && 'opacity-70'
                  )}
                />
                {step === 'analyzing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-bg/40 backdrop-blur-[2px]">
                    <div className="h-1 w-2/3 overflow-hidden rounded-full bg-border">
                      <div className="h-full w-1/3 animate-shimmer rounded-full bg-accent [background:linear-gradient(90deg,transparent,rgb(var(--accent)),transparent)] bg-[length:200px_100%]" />
                    </div>
                    <span className="text-xs font-medium text-fg">Analyzing your shades</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle">
                  <ScanFace className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-fg">Take or upload a selfie</p>
                  <p className="mt-1 max-w-xs text-sm text-fg-muted">
                    Face the light, no filters. The AI reads skin tone, undertone, lips, hair and
                    eyes.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={startCamera} leftIcon={<Camera className="h-4 w-4" />}>
                    Use camera
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => fileRef.current?.click()}
                    leftIcon={<ImageUp className="h-4 w-4" />}
                  >
                    Upload photo
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  data-testid="shade-file-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                    e.target.value = '';
                  }}
                />
              </div>
            )}
          </div>

          {/* Right: state panel */}
          <div className="border-t border-border p-6 lg:border-l lg:border-t-0">
            {step === 'preview' || step === 'analyzing' ? (
              <div className="flex h-full flex-col justify-center gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-fg">Almost there</h3>
                  <p className="mt-1 text-sm text-fg-muted">
                    Two optional details sharpen your matches. The photo is downscaled in your
                    browser; only the resulting color profile is stored.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={intake.skinType}
                    disabled={step === 'analyzing'}
                    onChange={(e) => setIntake((v) => ({ ...v, skinType: e.target.value }))}
                  >
                    <option value="">Skin type (optional)</option>
                    {['dry', 'oily', 'combination', 'sensitive', 'normal'].map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={intake.finish}
                    disabled={step === 'analyzing'}
                    onChange={(e) => setIntake((v) => ({ ...v, finish: e.target.value }))}
                  >
                    <option value="">Preferred finish (optional)</option>
                    {['matte', 'natural', 'dewy'].map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={analyze} loading={step === 'analyzing'} leftIcon={<Sparkles className="h-4 w-4" />}>
                    Find my matches
                  </Button>
                  <Button variant="secondary" onClick={reset} disabled={step === 'analyzing'}>
                    Retake
                  </Button>
                </div>
                {!aiEnabled && (
                  <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-fg-muted">
                    <span className="font-medium text-fg">Heads up:</span> ANTHROPIC_API_KEY is not
                    set, so the analysis call will fail until it is added to .env.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center gap-3">
                <h3 className="text-sm font-semibold text-fg">How it works</h3>
                <ol className="space-y-2 text-sm text-fg-muted">
                  <li>1. Take a selfie or upload a clear, well-lit photo.</li>
                  <li>2. AI reads skin tone, undertone, lip tone, hair and eye color.</li>
                  <li>3. You get matched products instantly, with a buy link on each.</li>
                </ol>
                <p className="text-xs text-fg-subtle">
                  Shoppers who are not ready to buy can save their matches by email at the end.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
