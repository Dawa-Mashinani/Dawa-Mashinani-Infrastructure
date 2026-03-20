import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Camera, Fingerprint, Heart, RotateCcw, ShieldAlert } from 'lucide-react';

type ScannerStatus = 'idle' | 'starting' | 'measuring' | 'done' | 'error';

interface Sample {
  t: number;
  value: number;
}

export interface MeasureResult {
  bpm: number | null;
  confidence: number;
  quality: number;
  rrMsMean: number | null;
  rrMsStd: number | null;
  perfusionIndex: number;
  durationSeconds: number;
  usedTorch: boolean;
  message: string;
}

interface FingerPulseScannerProps {
  onMeasured?: (result: MeasureResult) => void;
}

const MEASURE_SECONDS = 20;
const PREP_SECONDS = 5;
const MIN_SAMPLES_FOR_RESULT = 180;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const computeStats = (arr: number[]) => {
  if (arr.length === 0) return { mean: 0, std: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return { mean, std: Math.sqrt(variance) };
};

const movingAverage = (values: number[], window = 9) => {
  if (values.length < window) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length - 1, i + Math.floor(window / 2));
    const slice = values.slice(start, end + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
};

const detectPeaks = (times: number[], signal: number[]) => {
  const peaks: number[] = [];
  if (signal.length < 5) return peaks;

  const { std } = computeStats(signal);
  const threshold = std * 0.35;
  let lastPeakTime = -Infinity;

  for (let i = 2; i < signal.length - 2; i += 1) {
    const current = signal[i];
    const isLocalPeak =
      current > signal[i - 1] &&
      current > signal[i - 2] &&
      current >= signal[i + 1] &&
      current >= signal[i + 2];

    const t = times[i];
    const minSpacing = 350;

    if (isLocalPeak && current > threshold && t - lastPeakTime > minSpacing) {
      peaks.push(t);
      lastPeakTime = t;
    }
  }

  return peaks;
};

const computeResult = (samples: Sample[], qualityScore: number, durationSeconds: number, usedTorch: boolean): MeasureResult => {
  const values = samples.map((s) => s.value);
  const rawStats = computeStats(values);
  const perfusionIndex = clamp((rawStats.std / Math.max(rawStats.mean, 0.001)) * 100, 0, 20);

  if (samples.length < MIN_SAMPLES_FOR_RESULT) {
    return {
      bpm: null,
      confidence: 0,
      quality: qualityScore,
      rrMsMean: null,
      rrMsStd: null,
      perfusionIndex,
      durationSeconds,
      usedTorch,
      message: 'Not enough signal. Keep your finger steady and try again.',
    };
  }

  const times = samples.map((s) => s.t);
  const raw = samples.map((s) => s.value);
  const baseline = movingAverage(raw, 45);
  const detrended = raw.map((v, i) => v - (baseline[i] ?? 0));
  const smooth = movingAverage(detrended, 7);

  const peaks = detectPeaks(times, smooth);
  if (peaks.length < 4) {
    return {
      bpm: null,
      confidence: clamp(qualityScore * 0.4, 0, 0.5),
      quality: qualityScore,
      rrMsMean: null,
      rrMsStd: null,
      perfusionIndex,
      durationSeconds,
      usedTorch,
      message: 'Weak pulse wave detected. Press finger gently over camera and reduce movement.',
    };
  }

  const intervals = peaks.slice(1).map((t, i) => t - peaks[i]);
  const validIntervals = intervals.filter((rr) => rr >= 330 && rr <= 1500);
  if (validIntervals.length < 3) {
    return {
      bpm: null,
      confidence: clamp(qualityScore * 0.4, 0, 0.5),
      quality: qualityScore,
      rrMsMean: null,
      rrMsStd: null,
      perfusionIndex,
      durationSeconds,
      usedTorch,
      message: 'Pulse rhythm was too noisy. Try with better lighting and less motion.',
    };
  }

  const { mean: rrMsMean, std: rrMsStd } = computeStats(validIntervals);
  const bpm = Math.round(60000 / rrMsMean);

  if (bpm < 40 || bpm > 180) {
    return {
      bpm: null,
      confidence: clamp(qualityScore * 0.35, 0, 0.45),
      quality: qualityScore,
      rrMsMean,
      rrMsStd,
      perfusionIndex,
      durationSeconds,
      usedTorch,
      message: 'Out-of-range reading. Re-measure while seated and still.',
    };
  }

  const regularity = clamp(1 - rrMsStd / rrMsMean, 0, 1);
  const confidence = clamp(0.55 * qualityScore + 0.45 * regularity, 0, 1);

  return {
    bpm,
    confidence,
    quality: qualityScore,
    rrMsMean,
    rrMsStd,
    perfusionIndex,
    durationSeconds,
    usedTorch,
    message:
      confidence > 0.7
        ? 'Good quality reading.'
        : 'Reading captured with medium confidence. Consider repeating once.',
  };
};

const FingerPulseScanner = ({ onMeasured }: FingerPulseScannerProps) => {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [guidance, setGuidance] = useState('Cover rear camera and flash fully with your fingertip.');
  const [liveSignalQuality, setLiveSignalQuality] = useState(0);
  const [result, setResult] = useState<MeasureResult | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MEASURE_SECONDS);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(PREP_SECONDS);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const prepEndsAtRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const lastSampleRef = useRef<number>(0);
  const samplesRef = useRef<Sample[]>([]);
  const signalGoodFramesRef = useRef<number>(0);
  const totalFramesRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setProgress(0);
    setGuidance('Cover rear camera and flash fully with your fingertip.');
    setLiveSignalQuality(0);
    setResult(null);
    setError('');
    setSecondsLeft(MEASURE_SECONDS);
    setPrepSecondsLeft(PREP_SECONDS);
    samplesRef.current = [];
    signalGoodFramesRef.current = 0;
    totalFramesRef.current = 0;
    prepEndsAtRef.current = 0;
    startedAtRef.current = 0;
    lastSampleRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) {
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setStatus('error');
      setError('Could not access video processing context.');
      return;
    }

    const now = performance.now();

    if (startedAtRef.current === 0 && prepEndsAtRef.current > 0) {
      const prepRemaining = Math.max(0, prepEndsAtRef.current - now);
      setPrepSecondsLeft(Math.ceil(prepRemaining / 1000));
      setProgress(0);

      if (prepRemaining <= 0) {
        startedAtRef.current = now;
        setGuidance('Scan started. Keep finger still for 20 seconds.');
      }
    }

    const elapsed = startedAtRef.current > 0 ? (now - startedAtRef.current) / 1000 : 0;
    const width = 48;
    const height = 48;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    const frame = ctx.getImageData(0, 0, width, height).data;
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;

    for (let i = 0; i < frame.length; i += 4) {
      rSum += frame[i];
      gSum += frame[i + 1];
      bSum += frame[i + 2];
    }

    const pixels = frame.length / 4;
    const r = rSum / pixels;
    const g = gSum / pixels;
    const b = bSum / pixels;

    const redDominant = r > g * 1.12 && r > b * 1.18;
    const brightEnough = r > 40;
    const tooBright = r > 250;
    const signalGood = redDominant && brightEnough && !tooBright;

    if (startedAtRef.current > 0) {
      totalFramesRef.current += 1;
      if (signalGood) {
        signalGoodFramesRef.current += 1;
      }
    }

    const quality = signalGoodFramesRef.current / Math.max(1, totalFramesRef.current || 1);
    setLiveSignalQuality(quality);

    if (!signalGood) {
      if (!brightEnough) setGuidance('Turn on room light or use flash if available.');
      else if (tooBright) setGuidance('Reduce pressure or move away from direct strong light.');
      else setGuidance('Cover the lens and flash more fully with one finger.');
    } else {
      if (startedAtRef.current === 0) setGuidance('Good placement. Keep finger still, scan starts after countdown.');
      else setGuidance('Great. Keep still and keep breathing normally.');
    }

    if (startedAtRef.current > 0 && now - lastSampleRef.current > 33) {
      const ppgLike = r / Math.max(1, g + b);
      samplesRef.current.push({ t: now, value: ppgLike });
      lastSampleRef.current = now;
    }

    const normalizedProgress = clamp(elapsed / MEASURE_SECONDS, 0, 1);
    setProgress(normalizedProgress);
    setSecondsLeft(Math.max(0, Math.ceil(MEASURE_SECONDS - elapsed)));

    if (startedAtRef.current > 0 && elapsed >= MEASURE_SECONDS) {
      stopCamera();
      const finalResult = computeResult(samplesRef.current, quality, MEASURE_SECONDS, torchEnabled);
      setResult(finalResult);
      onMeasured?.(finalResult);
      setStatus('done');
      return;
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [onMeasured, stopCamera, torchEnabled]);

  const startMeasurement = useCallback(async () => {
    resetState();
    setStatus('starting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      const [videoTrack] = stream.getVideoTracks();
      const caps = videoTrack?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (caps?.torch) {
        try {
          await videoTrack.applyConstraints({ advanced: [{ torch: true } as unknown as MediaTrackConstraintSet] });
          setTorchSupported(true);
          setTorchEnabled(true);
        } catch {
          setTorchSupported(true);
          setTorchEnabled(false);
        }
      } else {
        setTorchSupported(false);
        setTorchEnabled(false);
      }

      const video = videoRef.current;
      if (!video) throw new Error('Camera preview unavailable.');

      video.srcObject = stream;
      await video.play();

      const now = performance.now();
      prepEndsAtRef.current = now + PREP_SECONDS * 1000;
      startedAtRef.current = 0;
      setPrepSecondsLeft(PREP_SECONDS);
      setGuidance('Place finger now. Scan begins in 5 seconds.');
      setStatus('measuring');
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (e) {
      setStatus('error');
      const message = e instanceof Error ? e.message : 'Unable to access camera.';
      setError(message);
      stopCamera();
    }
  }, [processFrame, resetState, stopCamera]);

  const stopMeasurement = useCallback(() => {
    stopCamera();
    setStatus('idle');
    setGuidance('Measurement stopped. Tap Start to try again.');
    setTorchEnabled(false);
  }, [stopCamera]);

  const qualityLabel = useMemo(() => {
    if (liveSignalQuality > 0.75) return 'Excellent signal';
    if (liveSignalQuality > 0.55) return 'Fair signal';
    return 'Weak signal';
  }, [liveSignalQuality]);

  return (
    <div className="bg-card rounded-xl p-4 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide">CAMERA PULSE CHECK</p>
          <h3 className="font-semibold text-foreground">Finger-on-Camera Heart Rate</h3>
        </div>
        <Heart className="w-5 h-5 text-destructive" />
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="flex items-center gap-2"><Fingerprint className="w-3.5 h-3.5" />Place one fingertip over rear camera + flash.</p>
        <p className="flex items-center gap-2"><Camera className="w-3.5 h-3.5" />You get 5 seconds to place finger, then 20-second scan starts automatically.</p>
        <p className="flex items-center gap-2"><Activity className="w-3.5 h-3.5" />This is a wellness estimate, not a diagnosis.</p>
        <p className="text-[11px]">
          Torch: {torchSupported ? (torchEnabled ? 'ON' : 'Supported but OFF') : 'Not supported by this browser/device'}
        </p>
      </div>

      <video ref={videoRef} className="w-full rounded-lg bg-black/80 aspect-video object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {(status === 'measuring' || status === 'starting') && (
        <>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{guidance}</span>
            <span className={liveSignalQuality > 0.55 ? 'text-success' : 'text-orange-500'}>{qualityLabel}</span>
          </div>
          <div className="text-xs font-semibold text-foreground">
            {startedAtRef.current > 0 ? `Time left: ${secondsLeft}s` : `Place finger: starts in ${prepSecondsLeft}s`}
          </div>
        </>
      )}

      {status === 'error' && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5" />
          <span>{error || 'Could not start measurement. Check permissions and try again.'}</span>
        </div>
      )}

      {result && status === 'done' && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">{result.bpm ?? '--'}</span>
            <span className="text-sm text-muted-foreground mb-1">BPM</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background rounded-md p-2 border border-border">
              <p className="text-muted-foreground">Signal Quality</p>
              <p className="font-semibold text-foreground">{Math.round(result.quality * 100)}%</p>
            </div>
            <div className="bg-background rounded-md p-2 border border-border">
              <p className="text-muted-foreground">Confidence</p>
              <p className="font-semibold text-foreground">{Math.round(result.confidence * 100)}%</p>
            </div>
            <div className="bg-background rounded-md p-2 border border-border">
              <p className="text-muted-foreground">Perfusion Index</p>
              <p className="font-semibold text-foreground">{result.perfusionIndex.toFixed(2)}%</p>
            </div>
            <div className="bg-background rounded-md p-2 border border-border">
              <p className="text-muted-foreground">Duration</p>
              <p className="font-semibold text-foreground">{result.durationSeconds}s</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{result.message}</p>
        </div>
      )}

      <div className="flex gap-2">
        {(status === 'idle' || status === 'error' || status === 'done') && (
          <button
            onClick={startMeasurement}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Start 20s Scan
          </button>
        )}

        {(status === 'measuring' || status === 'starting') && (
          <button
            onClick={stopMeasurement}
            className="flex-1 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium"
          >
            Stop
          </button>
        )}

        {(status === 'done' || status === 'error') && (
          <button
            onClick={() => {
              setStatus('idle');
              resetState();
            }}
            className="px-3 py-2.5 rounded-lg bg-card border border-border text-foreground"
            aria-label="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        For emergency symptoms (chest pain, fainting, severe breathing difficulty), use SOS or go to the nearest facility immediately.
      </p>
    </div>
  );
};

export default FingerPulseScanner;
