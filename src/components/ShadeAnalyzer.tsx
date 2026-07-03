'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ImageUp, RefreshCw, ScanFace, Sparkles, X } from 'lucide-react';
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

// Downscale to keep the request small and strip EXIF, returns raw base64
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

export default function ShadeAnalyzer({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('capture');
  const [photo, setPhoto] = useState<{ base64: string; dataUrl: string; mediaType: string } | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [intake, setIntake] = useState({ skinType: '', finish: '' });
  const [email, setEmail] = useState('');
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
      // Attach after state flips so the <video> exists.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error('Camera unavailable, check browser permissions, or upload a photo instead.');
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
      const res = await fetch('/api/brand/shade/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photo.base64,
          mediaType: photo.mediaType,
          ...(email.trim() ? { email: email.trim() } : {}),
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
      setStep('results');
      router.refresh(); // the profile appears in the analyses table below
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed');
      setStep('preview');
    }
  };

  const reset = () => {
    stopCamera();
    setPhoto(null);
    setAnalysis(null);
    setRecommendations([]);
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
                    <span className="text-xs font-medium text-fg">Analyzing your shades…</span>
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
                    Face the light, no filters. The AI reads skin tone, undertone, lips, hair and eyes.
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
            {step === 'results' && analysis ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
                    <Sparkles className="h-4 w-4 text-accent" /> Your color profile
                  </h3>
                  <Button size="sm" variant="ghost" onClick={reset} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                    Analyze another
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {attributes.map((a) => (
                    <div key={a.label} className="rounded-md border border-border bg-surface-2/40 px-3 py-2">
                      <div className="text-2xs uppercase tracking-[0.15em] text-fg-subtle">{a.label}</div>
                      <div className="mt-0.5 text-sm font-medium capitalize text-fg">{a.value || '—'}</div>
                    </div>
                  ))}
                </div>
                {analysis.notes && <p className="text-sm text-fg-muted">{analysis.notes}</p>}
                <div>
                  <h4 className="text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                    Matched products ({recommendations.length})
                  </h4>
                  {recommendations.length === 0 ? (
                    <p className="mt-2 text-sm text-fg-muted">
                      No catalog matches yet, tag shade tones on your products to power recommendations.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {recommendations.map((p) => (
                        <a
                          key={p.id}
                          href={p.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-md border border-border p-2 transition-colors hover:border-accent/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover ring-1 ring-border" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-fg">{p.name}</div>
                            <div className="text-xs text-fg-muted">${p.price.toFixed(2)}</div>
                          </div>
                          {p.tryOnEnabled && <Badge tone="accent">try-on</Badge>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : step === 'preview' || step === 'analyzing' ? (
              <div className="flex h-full flex-col justify-center gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-fg">Ready to analyze</h3>
                  <p className="mt-1 text-sm text-fg-muted">
                    The photo is downscaled in your browser and sent to Claude vision. Nothing is stored
                    except the resulting color profile.
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
                <Input
                  type="email"
                  placeholder="Email the results (optional, saves to the customer profile)"
                  value={email}
                  disabled={step === 'analyzing'}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={analyze} loading={step === 'analyzing'} leftIcon={<Sparkles className="h-4 w-4" />}>
                    Analyze shades
                  </Button>
                  <Button variant="secondary" onClick={reset} disabled={step === 'analyzing'}>
                    Retake
                  </Button>
                </div>
                {!aiEnabled && (
                  <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-fg-muted">
                    <span className="font-medium text-fg">Heads up:</span> ANTHROPIC_API_KEY isn&apos;t set, so
                    the analysis call will fail until it&apos;s added to .env.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center gap-3">
                <h3 className="text-sm font-semibold text-fg">How it works</h3>
                <ol className="space-y-2 text-sm text-fg-muted">
                  <li>1, Take a selfie or upload a clear, well-lit photo.</li>
                  <li>2, Claude vision reads skin tone, undertone, lip tone, hair and eye color.</li>
                  <li>3 | Avori matches the profile against products tagged with shade tones.</li>
                </ol>
                <p className="text-xs text-fg-subtle">
                  Same engine your storefront calls via POST /api/v1/shade/analyze.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
