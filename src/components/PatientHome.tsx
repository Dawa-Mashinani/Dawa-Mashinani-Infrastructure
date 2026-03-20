import { useState, useEffect } from 'react';
import { AlertTriangle, User, Stethoscope, Send, FileText, Clock, CheckCircle2, TrendingUp, Zap, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { askRafikiAI } from '@/lib/api';
import BottomNav from './BottomNav';
import SettingsPanel from './SettingsPanel';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';
import FingerPulseScanner, { type MeasureResult } from './FingerPulseScanner';

interface PatientHomeProps {
  user: MockUser;
  onLogout: () => void;
}


interface ScanHistoryItem {
  id: string;
  recordedAt: string;
  bpm: number | null;
  quality: number;
  confidence: number;
  perfusionIndex: number;
  usedTorch: boolean;
  healthScore: number;
}

const PatientHome = ({ user, onLogout }: PatientHomeProps) => {
  const userScopeKey = [
    user.role,
    user.phone,
    user.afyaId,
    user.name.trim().toLowerCase().replace(/\s+/g, '-'),
  ].join(':');
  const scanHistoryKey = `mlinzi-scan-history:${userScopeKey}`;

  const [activeTab, setActiveTab] = useState('home');
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string }[]>([
    { from: 'rafiki', text: 'I am Rafiki, your AI health companion powered by Gemini. I can help with symptom assessment, medication guidance, and connecting you to healthcare professionals. What symptoms are you experiencing?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [records, setRecords] = useState<{ id: string; resource_type: string; code: string; value: string; sha256_hash: string; recorded_at: string }[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [scanResult, setScanResult] = useState<MeasureResult | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [mlinziRecommendations, setMlinziRecommendations] = useState<string[]>([]);
  const [mlinziAiLoading, setMlinziAiLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const { speak, currentStep, tourActive, nextStep, startTour, endTour, setTotalSteps, setActiveView, setActiveRole } = useMsaidizi();

  // Sync active view for context-aware MsaidiziGuide
  useEffect(() => {
    setActiveRole('patient');
    setActiveView(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    // Start Patient Tour (runs once on mount) after initial login welcome finishes
    const t1 = setTimeout(() => {
      setTotalSteps(6);
      startTour();
    }, 5500);

    return () => clearTimeout(t1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tourActive) return;

    let timeoutId: number;

    if (currentStep === 1) {
      speak(
        `Jambo ${user.name.split(' ')[0]}! Welcome to Dawa Mashinani. I am Msaidizi, your personal guide. Let me walk you through your dashboard.`,
        `Jambo ${user.name.split(' ')[0]}! Karibu kwenye Dawa Mashinani. Mimi ni Msaidizi, kiongozi wako. Wacha nikuonyeshe dashibodi yako.`,
        11000
      );
      timeoutId = window.setTimeout(() => nextStep(), 12000);
    } else if (currentStep === 2) {
      speak(
        "This is Rafiki AI — your personal health assistant. You can chat with Rafiki anytime to check your symptoms, ask health questions, and get quick medical advice. Try it out!",
        "Huyu ni Rafiki AI — msaidizi wako wa afya. Unaweza kuzungumza naye wakati wowote kuangalia dalili, kuuliza maswali, na kupata ushauri wa haraka. Jaribu!",
        15000
      );
      timeoutId = window.setTimeout(() => nextStep(), 16000);
    } else if (currentStep === 3) {
      speak(
        "Next is Jirani — it connects you with nearby Community Health Promoters and local clinics. All your health records from field visits appear here, and your data is well secured.",
        "Ifuatayo ni Jirani — inakuunganisha na Wahudumu wa Afya wa Kijijini na zahanati zilizo karibu. Rekodi zako zote za afya zinaonekana hapa, na data yako imelindwa vizuri.",
        15000
      );
      timeoutId = window.setTimeout(() => nextStep(), 16000);
    } else if (currentStep === 4) {
      speak(
        "This is Mlinzi — your health monitor. You can run a camera pulse scan, get a real-time health score, save scan history, download a personalized report, and receive Rafiki recommendations based on your latest measurements.",
        "Hii ni Mlinzi — kifuatiliaji chako cha afya. Unaweza kufanya kipimo cha mpigo wa moyo kwa kamera, kupata alama ya afya kwa wakati halisi, kuhifadhi historia ya vipimo, kupakua ripoti binafsi, na kupata mapendekezo ya Rafiki kulingana na vipimo vya karibuni.",
        15000
      );
      timeoutId = window.setTimeout(() => nextStep(), 16000);
    } else if (currentStep === 5) {
      speak(
        "Finally, the More tab — here you can view your profile, manage privacy settings, change language, or switch your role and log out of the system.",
        "Mwishowe, kitufe cha Zaidi — hapa unaweza kuona wasifu wako, kudhibiti faragha, kubadilisha lugha, au kubadilisha jukumu na kutoka.",
        15000
      );
      timeoutId = window.setTimeout(() => nextStep(), 16000);
    } else if (currentStep === 6) {
      speak(
        "You are all set! Explore the tabs below and tap my icon anytime you need help. Let's improve your health journey together! 🎉",
        "Uko tayari! Chunguza vitufe hapa chini na ubonyeze ikoni yangu wakati wowote unahitaji msaada. Tuboreshe safari yako ya afya pamoja! 🎉",
        11000
      );
      timeoutId = window.setTimeout(() => endTour(), 13000);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, tourActive]);

  // Load health records from DB
  useEffect(() => {
    if (activeTab === 'jirani') {
      setLoadingRecords(true);
      // Find patient by phone, then get records
      const loadRecords = async () => {
        try {
          const { data: patient } = await supabase
            .from('patients')
            .select('id')
            .eq('phone', user.phone)
            .single();
          if (patient) {
            const { data: recs } = await supabase
              .from('health_records')
              .select('*')
              .eq('patient_id', patient.id)
              .order('recorded_at', { ascending: false });
            setRecords(recs || []);
          }
        } catch (e) {
          console.error('Failed to load records:', e);
        } finally {
          setLoadingRecords(false);
        }
      };
      loadRecords();
    }
  }, [activeTab, user.phone]);

  useEffect(() => {
    setScanResult(null);
    setHealthScore(null);
    setMlinziRecommendations([]);
    setMlinziAiLoading(false);

    try {
      const raw = localStorage.getItem(scanHistoryKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ScanHistoryItem[];
        setScanHistory(Array.isArray(parsed) ? parsed : []);
      } else {
        setScanHistory([]);
      }
    } catch (e) {
      console.error('Failed to load scan history:', e);
      setScanHistory([]);
    }
  }, [scanHistoryKey]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiThinking) return;
    const userText = chatInput;
    const updatedMessages = [...chatMessages, { from: 'user', text: userText }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsAiThinking(true);

    try {
      const { reply, severity } = await askRafikiAI(userText, updatedMessages);
      setChatMessages((prev) => [...prev, { from: 'rafiki', text: reply }]);
      // If critical/high severity, optionally show warning
      if (severity === 'critical' || severity === 'high') {
        console.log(`[RAFIKI] High severity detected: ${severity}`);
      }
    } catch (err) {
      console.error('[RAFIKI] AI error:', err);
      setChatMessages((prev) => [...prev, { from: 'rafiki', text: 'I\'m having trouble connecting right now. For urgent concerns, please dial 112 or visit your nearest health facility.' }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const calculateHealthScore = (result: MeasureResult): number => {
    if (!result.bpm) return 0;

    const bpm = result.bpm;
    const bpmScore = bpm >= 55 && bpm <= 95
      ? 1
      : Math.max(0, 1 - Math.min(Math.abs(bpm - 75), 55) / 55);

    const rhythmRegularity = result.rrMsMean && result.rrMsStd
      ? Math.max(0, 1 - result.rrMsStd / result.rrMsMean)
      : 0.4;

    const perfusionScore = Math.min(result.perfusionIndex / 8, 1);

    const score = (
      bpmScore * 0.4 +
      result.quality * 0.22 +
      result.confidence * 0.22 +
      rhythmRegularity * 0.1 +
      perfusionScore * 0.06
    ) * 100;

    return Math.round(Math.max(0, Math.min(100, score)));
  };

  const parseAiRecommendations = (reply: string): string[] => {
    const bulletLines = reply
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[-•*\d.]/.test(line))
      .map((line) => line.replace(/^[-•*\d.\s]+/, '').trim())
      .filter(Boolean);

    if (bulletLines.length >= 2) return bulletLines.slice(0, 4);

    return reply
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8)
      .slice(0, 4);
  };

  const buildFallbackRecommendations = (result: MeasureResult): string[] => {
    const fallback: string[] = [];

    if (result.bpm && result.bpm > 105) {
      fallback.push('Your pulse is elevated. Sit quietly for 5 minutes, hydrate, then repeat a scan.');
    } else if (result.bpm && result.bpm < 55) {
      fallback.push('Your pulse is on the low side. If you feel dizzy, weak, or unwell, contact a clinician.');
    } else {
      fallback.push('Pulse is within a common resting range. Continue regular sleep, hydration, and light activity.');
    }

    if (result.quality < 0.65 || result.confidence < 0.65) {
      fallback.push('Signal quality was moderate. Repeat with finger fully covering lens + flash and keep still.');
    }

    fallback.push('Track 3-5 readings at similar times each day to build a useful trend.');
    return fallback.slice(0, 4);
  };

  const handlePulseMeasured = async (result: MeasureResult) => {
    setScanResult(result);

    const computedScore = calculateHealthScore(result);
    setHealthScore(computedScore);

    const newEntry: ScanHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recordedAt: new Date().toISOString(),
      bpm: result.bpm,
      quality: result.quality,
      confidence: result.confidence,
      perfusionIndex: result.perfusionIndex,
      usedTorch: result.usedTorch,
      healthScore: computedScore,
    };

    setScanHistory((prev) => {
      const next = [newEntry, ...prev].slice(0, 30);
      localStorage.setItem(scanHistoryKey, JSON.stringify(next));
      return next;
    });

    try {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', user.phone)
        .single();

      if (patient?.id) {
        await supabase.from('clinical_vitals').insert({
          patient_id: patient.id,
          pulse: result.bpm,
          notes: `Mlinzi camera scan | quality=${Math.round(result.quality * 100)}% confidence=${Math.round(result.confidence * 100)}% perfusion=${result.perfusionIndex.toFixed(2)}% torch=${result.usedTorch ? 'on' : 'off'} health_score=${computedScore}`,
        });
      }
    } catch (e) {
      console.error('Failed to autosave scan result to Supabase:', e);
    }

    if (!result.bpm) {
      setMlinziRecommendations(buildFallbackRecommendations(result));
      return;
    }

    setMlinziAiLoading(true);
    try {
      const prompt = `Use these live camera pulse measurements and give 3 to 4 concise, personalized wellness recommendations. Measurements: BPM=${result.bpm}, quality=${Math.round(result.quality * 100)}%, confidence=${Math.round(result.confidence * 100)}%, perfusion index=${result.perfusionIndex.toFixed(2)}%, rr_mean_ms=${result.rrMsMean ?? 'n/a'}, rr_std_ms=${result.rrMsStd ?? 'n/a'}, health_score=${computedScore}/100, torch_used=${result.usedTorch ? 'yes' : 'no'}. Keep language simple and practical. Mention when to seek urgent care if warning symptoms appear.`;
      const { reply } = await askRafikiAI(prompt, [{ from: 'user', text: prompt }]);
      const parsed = parseAiRecommendations(reply);
      setMlinziRecommendations(parsed.length ? parsed : buildFallbackRecommendations(result));
    } catch (e) {
      console.error('Failed to get AI recommendations from pulse data:', e);
      setMlinziRecommendations(buildFallbackRecommendations(result));
    } finally {
      setMlinziAiLoading(false);
    }
  };

  const downloadPersonalizedReport = () => {
    if (!scanHistory.length && !scanResult) return;

    const latest = scanResult || scanHistory[0] || null;
    const latestDerivedScore = latest && 'healthScore' in latest ? latest.healthScore : null;
    const reportDate = new Date().toLocaleString();
    const recommendationsText = mlinziRecommendations.length
      ? mlinziRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : 'No recommendations yet. Complete a scan to generate personalized advice.';

    const historyText = scanHistory
      .slice(0, 20)
      .map((item, idx) => {
        const dt = new Date(item.recordedAt).toLocaleString();
        return `${idx + 1}. ${dt} | BPM=${item.bpm ?? '--'} | Quality=${Math.round(item.quality * 100)}% | Confidence=${Math.round(item.confidence * 100)}% | Perfusion=${item.perfusionIndex.toFixed(2)}% | Score=${item.healthScore} | Torch=${item.usedTorch ? 'Yes' : 'No'}`;
      })
      .join('\n');

    const content = [
      'DAWA MASHINANI - MLINZI PERSONALIZED REPORT',
      '===========================================',
      `Generated: ${reportDate}`,
      `Patient: ${user.name}`,
      `Phone: ${user.phone}`,
      `Afya ID: ${user.afyaId}`,
      '',
      'LATEST SCAN',
      '-----------',
      `Heart Rate (BPM): ${latest?.bpm ?? '--'}`,
      `Signal Quality: ${latest ? `${Math.round(latest.quality * 100)}%` : '--'}`,
      `Confidence: ${latest ? `${Math.round(latest.confidence * 100)}%` : '--'}`,
      `Perfusion Index: ${latest ? `${latest.perfusionIndex.toFixed(2)}%` : '--'}`,
      `Torch Used: ${latest?.usedTorch ? 'Yes' : 'No'}`,
      `Health Score: ${healthScore ?? latestDerivedScore ?? '--'}/100`,
      '',
      'PERSONALIZED RECOMMENDATIONS',
      '-----------------------------',
      recommendationsText,
      '',
      'SCAN HISTORY (LATEST 20)',
      '------------------------',
      historyText || 'No history yet.',
      '',
      'DISCLAIMER',
      '----------',
      'This camera-based pulse check is for wellness tracking only and is not a medical diagnosis.',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = user.name.replace(/\s+/g, '_');
    a.href = url;
    a.download = `Mlinzi_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden">
            <img src="/Dawa-Mashinani-favicon.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-foreground font-[Inter]">Dawa Mashinani</span>
        </div>
        <button className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          SOS
        </button>
      </div>

      {activeTab === 'home' && (
        <div className="px-4 pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-[Inter]">
                Hello, {user.name.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Your health companion is standing by.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <User className="w-5 h-5 text-accent-foreground" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-primary/15 rounded-2xl p-5 transition-all duration-500 ${tourActive && currentStep === 2 ? 'ring-4 ring-primary ring-opacity-60 animate-pulse' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground font-[Inter]">Rafiki AI</h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Your AI health assistant is ready.
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
            </div>
            <button
              onClick={() => setActiveTab('rafiki')}
              className="mt-4 w-full py-2.5 rounded-xl bg-card text-primary font-semibold text-sm tracking-wide border border-primary/20"
            >
              START CONSULTATION
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-card rounded-2xl p-4 border border-border transition-all duration-500 ${tourActive && currentStep === 4 ? 'ring-4 ring-primary ring-opacity-60 animate-pulse' : ''}`}
          >
            <p className="text-xs text-muted-foreground font-medium tracking-wide mb-2">DIGITAL AFYA ID</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{user.afyaId}</p>
                <p className="text-sm text-muted-foreground">{user.phone}</p>
              </div>
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-[8px] text-muted-foreground">QR Code</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'rafiki' && (
        <div className="flex flex-col h-[calc(100vh-130px)]">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-bold text-foreground font-[Inter]">Rafiki AI Chat</h2>
            <p className="text-xs text-muted-foreground">Describe your symptoms</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    msg.from === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm bg-muted text-foreground rounded-bl-md flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Rafiki is thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div className={`px-4 py-3 border-t border-border flex gap-2 transition-all duration-500 rounded-t-xl ${tourActive && currentStep === 2 && activeTab === 'rafiki' ? 'bg-primary/10 ring-4 ring-primary ring-opacity-50 animate-pulse pb-24' : ''}`}>
            <input
              type="text"
              value={chatInput}
              disabled={isAiThinking}
              onFocus={() => {
                if (tourActive && currentStep === 2) nextStep();
              }}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isAiThinking ? "Rafiki is thinking..." : "Describe your symptoms..."}
              className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isAiThinking}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'jirani' && (
        <div className="px-4 pt-4 space-y-3">
          <h2 className="font-bold text-foreground font-[Inter] text-lg">Jirani Health Ledger</h2>
          <p className="text-sm text-muted-foreground mb-4">Your medical history is well secured</p>
          {loadingRecords ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading records...</p>
          ) : records.length > 0 ? (
            records.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-3.5 border border-border"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary">{rec.resource_type}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(rec.recorded_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="font-semibold text-foreground text-sm">{rec.code}</p>
                <p className="text-sm text-muted-foreground">{rec.value}</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Security ID: {rec.sha256_hash.substring(0, 12)}...</span>
                  <span className="ml-1 text-success">✓ Verified</span>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No records found</p>
          )}
        </div>
      )}

      {activeTab === 'mlinzi' && (
        <div className="px-4 pt-4 space-y-3">
          <h2 className="font-bold text-foreground font-[Inter] text-lg">Mlinzi Health Monitor</h2>
          <p className="text-sm text-muted-foreground mb-4">Predictive health insights from your data + camera wellness checks</p>
          <button
            onClick={downloadPersonalizedReport}
            disabled={!scanHistory.length && !scanResult}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download Personalized Report
          </button>
          <FingerPulseScanner onMeasured={handlePulseMeasured} />

          {scanResult && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground font-medium tracking-wide mb-2">LATEST SCAN SUMMARY</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 rounded-md p-2">
                  <p className="text-muted-foreground">Heart Rate</p>
                  <p className="font-semibold text-foreground">{scanResult.bpm ?? '--'} BPM</p>
                </div>
                <div className="bg-muted/40 rounded-md p-2">
                  <p className="text-muted-foreground">Signal Quality</p>
                  <p className="font-semibold text-foreground">{Math.round(scanResult.quality * 100)}%</p>
                </div>
                <div className="bg-muted/40 rounded-md p-2">
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-semibold text-foreground">{Math.round(scanResult.confidence * 100)}%</p>
                </div>
                <div className="bg-muted/40 rounded-md p-2">
                  <p className="text-muted-foreground">Torch Used</p>
                  <p className="font-semibold text-foreground">{scanResult.usedTorch ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          {scanHistory.length > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground font-medium tracking-wide mb-2">SCAN HISTORY</p>
              <div className="space-y-2">
                {scanHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">{item.bpm ?? '--'} BPM</span>
                      <span className="text-muted-foreground">{new Date(item.recordedAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                      <span>Q: {Math.round(item.quality * 100)}%</span>
                      <span>C: {Math.round(item.confidence * 100)}%</span>
                      <span>PI: {item.perfusionIndex.toFixed(1)}%</span>
                      <span>HS: {item.healthScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground font-medium tracking-wide mb-2">HEALTH SCORE</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${healthScore !== null && healthScore >= 75 ? 'text-success' : healthScore !== null && healthScore >= 55 ? 'text-orange-500' : 'text-destructive'}`}>
                {healthScore ?? '--'}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div
                className={`h-2 rounded-full ${healthScore !== null && healthScore >= 75 ? 'bg-success' : healthScore !== null && healthScore >= 55 ? 'bg-orange-500' : 'bg-destructive'}`}
                style={{ width: `${Math.max(0, Math.min(healthScore ?? 0, 100))}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Score is computed from live pulse BPM, rhythm stability, signal quality, confidence, and perfusion index.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground font-medium tracking-wide mb-3">HEALTH RECOMMENDATIONS</p>

            {mlinziAiLoading ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Rafiki is generating recommendations from your live measurements...
              </div>
            ) : mlinziRecommendations.length > 0 ? (
              <ul className="space-y-2 text-sm text-foreground">
                {mlinziRecommendations.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2 items-start">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Complete a camera pulse scan to get personalized recommendations.</p>
            )}
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground font-medium tracking-wide mb-2">WHAT THIS CAMERA CHECK CAN DO</p>
            <ul className="space-y-1.5 text-sm text-foreground">
              <li>• Estimate resting heart rate (BPM) from blood-flow light changes</li>
              <li>• Score signal quality and confidence in each reading</li>
              <li>• Support trend tracking over time for wellness follow-up</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Not a medical diagnosis tool. It cannot replace ECG, blood pressure cuff, pulse oximeter, or clinician assessment.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'more' && (
        <SettingsPanel user={user} onLogout={onLogout} />
      )}

      <BottomNav role="patient" activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default PatientHome;
