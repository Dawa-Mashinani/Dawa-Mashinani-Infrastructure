import { useState, useEffect } from 'react';
import { AlertTriangle, User, Stethoscope, Send, FileText, Clock, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { MockUser, RAFIKI_RESPONSES } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from './BottomNav';

interface PatientHomeProps {
  user: MockUser;
  onLogout: () => void;
}

const PatientHome = ({ user, onLogout }: PatientHomeProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string }[]>([
    { from: 'rafiki', text: RAFIKI_RESPONSES['default'] },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const input = chatInput.toLowerCase();
    setChatMessages((prev) => [...prev, { from: 'user', text: chatInput }]);
    setChatInput('');

    setTimeout(() => {
      const key = Object.keys(RAFIKI_RESPONSES).find((k) => input.includes(k)) || 'default';
      setChatMessages((prev) => [...prev, { from: 'rafiki', text: RAFIKI_RESPONSES[key] }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary" />
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
            className="bg-primary/15 rounded-2xl p-5"
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
            className="bg-card rounded-2xl p-4 border border-border"
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
          </div>
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe your symptoms..."
              className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSendMessage}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
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
        <div className="px-4 pt-4 space-y-3">
          <h2 className="font-bold text-foreground font-[Inter] text-lg">Settings</h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <div className="p-4">
              <p className="font-medium text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
            <button className="w-full p-4 text-left text-sm text-foreground">Privacy & Security</button>
            <button className="w-full p-4 text-left text-sm text-foreground">Language</button>
            <button onClick={onLogout} className="w-full p-4 text-left text-sm text-destructive">
              Switch Role / Logout
            </button>
          </div>
        </div>
      )}

      <BottomNav role="patient" activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default PatientHome;
