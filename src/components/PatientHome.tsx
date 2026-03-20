import { useState, useEffect } from 'react';
import { AlertTriangle, User, Stethoscope, Send, FileText, Clock, CheckCircle2, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { askRafikiAI } from '@/lib/api';
import BottomNav from './BottomNav';
import SettingsPanel from './SettingsPanel';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';

interface PatientHomeProps {
  user: MockUser;
  onLogout: () => void;
}

const PatientHome = ({ user, onLogout }: PatientHomeProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string }[]>([
    { from: 'rafiki', text: 'I am Rafiki, your AI health companion powered by Gemini. I can help with symptom assessment, medication guidance, and connecting you to healthcare professionals. What symptoms are you experiencing?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [records, setRecords] = useState<{ id: string; resource_type: string; code: string; value: string; sha256_hash: string; recorded_at: string }[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const { speak, currentStep, tourActive, nextStep, startTour, endTour, setTotalSteps, setActiveView, setActiveRole } = useMsaidizi();

  // Sync active view for context-aware MsaidiziGuide
  useEffect(() => {
    setActiveRole('patient');
    setActiveView(activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Start Patient Tour
    const t1 = setTimeout(() => {
      setTotalSteps(6);
      startTour();
    }, 1500);

    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!tourActive) return;

    let timeoutId: number;

    if (currentStep === 1) {
      speak(
        `Jambo ${user.name.split(' ')[0]}! Welcome to Dawa Mashinani. I am Msaidizi, your personal guide. Let me walk you through your dashboard.`,
        `Jambo ${user.name.split(' ')[0]}! Karibu kwenye Dawa Mashinani. Mimi ni Msaidizi, kiongozi wako. Wacha nikuonyeshe dashibodi yako.`,
        8000
      );
      timeoutId = window.setTimeout(() => nextStep(), 9000);
    } else if (currentStep === 2) {
      speak(
        "This is Rafiki AI — your personal health assistant. You can chat with Rafiki anytime to check your symptoms, ask health questions, and get quick medical advice. Try it out!",
        "Huyu ni Rafiki AI — msaidizi wako wa afya. Unaweza kuzungumza naye wakati wowote kuangalia dalili, kuuliza maswali, na kupata ushauri wa haraka. Jaribu!",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 3) {
      speak(
        "Next is Jirani — it connects you with nearby Community Health Promoters and local clinics. All your health records from field visits appear here, secured with SHA-256 encryption.",
        "Ifuatayo ni Jirani — inakuunganisha na Wahudumu wa Afya wa Kijijini na zahanati zilizo karibu. Rekodi zako zote za afya zinaonekana hapa, zilizolindwa na SHA-256.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 4) {
      speak(
        "This is Mlinzi — your secure digital health wallet. It stores your Afya ID, shows your health score, and gives you personalized health recommendations to stay on track.",
        "Hii ni Mlinzi — mkoba wako salama wa afya. Inahifadhi Kitambulisho chako cha Afya, inaonyesha alama yako ya afya, na inakupa mapendekezo ya kibinafsi.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 5) {
      speak(
        "Finally, the More tab — here you can view your profile, manage privacy settings, change language, or switch your role and log out of the system.",
        "Mwishowe, kitufe cha Zaidi — hapa unaweza kuona wasifu wako, kudhibiti faragha, kubadilisha lugha, au kubadilisha jukumu na kutoka.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 6) {
      speak(
        "You are all set! Explore the tabs below and tap my icon anytime you need help. Let's improve your health journey together! 🎉",
        "Uko tayari! Chunguza vitufe hapa chini na ubonyeze ikoni yangu wakati wowote unahitaji msaada. Tuboreshe safari yako ya afya pamoja! 🎉",
        8000
      );
      timeoutId = window.setTimeout(() => endTour(), 9000);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
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
          <p className="text-sm text-muted-foreground mb-4">Your medical history, secured with SHA-256</p>
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
                  <span>SHA-256: {rec.sha256_hash.substring(0, 12)}...</span>
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
          <p className="text-sm text-muted-foreground mb-4">Predictive health insights from your data</p>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground font-medium tracking-wide mb-2">HEALTH SCORE</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-success">82</span>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div className="bg-success h-2 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground font-medium tracking-wide mb-3">HEALTH RECOMMENDATIONS</p>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex gap-2 items-center">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                Schedule blood pressure follow-up
              </li>
              <li className="flex gap-2 items-center">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                Update tetanus booster records
              </li>
              <li className="flex gap-2 items-center">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                Complete annual health screening
              </li>
            </ul>
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
