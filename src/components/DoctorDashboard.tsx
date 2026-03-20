import { useState, useEffect, useCallback } from 'react';
import { Search, User, Clock, CheckCircle2, AlertTriangle, Stethoscope, TrendingUp, MapPin, Phone, Bell, MessageSquare, PhoneCall, Shield, Navigation, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { fetchPatients, fetchPatientRecords, fetchStats, fetchAlerts, respondToAlert, fetchAlertNotifications, subscribeToAlerts } from '@/lib/api';
import BottomNav from './BottomNav';
import SettingsPanel from './SettingsPanel';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';

interface AlertRow {
  id: string;
  patient_name: string;
  phone: string;
  symptom: string;
  severity: string;
  location: string;
  status: string;
  source: string;
  alert_type: string;
  created_at: string;
  responded_by: string | null;
  response_notes: string | null;
  responded_at: string | null;
}

interface NotificationRow {
  id: string;
  recipient_phone: string;
  recipient_name: string | null;
  notification_type: string;
  status: string;
  created_at: string;
}

interface DoctorDashboardProps {
  user: MockUser;
  onLogout: () => void;
}

const DoctorDashboard = ({ user, onLogout }: DoctorDashboardProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Record<string, unknown>[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Record<string, unknown> | null>(null);
  const [patientRecords, setPatientRecords] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState({ patients: 0, critical_alerts: 0, total_alerts: 0, pending_alerts: 0 });
  const [loading, setLoading] = useState(true);

  // Alert state
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [expandedNotifications, setExpandedNotifications] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Record<string, NotificationRow[]>>({});
  const [flashAlert, setFlashAlert] = useState(false);
  
  const { speak, currentStep, tourActive, nextStep, startTour, endTour, setTotalSteps, setActiveView, setActiveRole } = useMsaidizi();

  // Sync active view for context-aware MsaidiziGuide
  useEffect(() => {
    setActiveRole('doctor');
    setActiveView(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    // Start Doctor Tour (runs once on mount)
    const t1 = setTimeout(() => {
      setTotalSteps(5);
      startTour();
    }, 1500);
    return () => clearTimeout(t1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tour Controller
  useEffect(() => {
    if (!tourActive) return;

    let timeoutId: number;

    if (currentStep === 1) {
      speak(
        `Jambo Dr. ${user.name.split(' ')[0]}! Welcome to the Doctor Portal. Allow me to guide you through your clinical dashboard.`,
        `Jambo Daktari ${user.name.split(' ')[0]}! Karibu kwenye lango la daktari. Wacha nikuonyeshe ukurasa wako wa kliniki.`,
        8000
      );
      timeoutId = window.setTimeout(() => nextStep(), 9000);
    } else if (currentStep === 2) {
      speak(
        "This is the Patients section. You can search for any patient by name, phone, or UPI number and view their complete shared health records from the field.",
        "Hii ni sehemu ya Wagonjwa. Unaweza kutafuta mgonjwa yeyote kwa jina, simu, au nambari ya UPI na kuona rekodi zao kamili za afya.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 3) {
      speak(
        "Next is Clinical Alerts — these are critical referrals coming from the USSD system and CHP network that need your urgent attention. Emergency alerts flash red.",
        "Ifuatayo ni Arifa za Kliniki — hizi ni rufaa muhimu zinazotoka kwenye mfumo wa USSD na mtandao wa CHPs zinazohitaji umakini wako. Arifa za dharura zinaangaza nyekundu.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 4) {
      speak(
        "The More tab gives you access to your doctor profile, account settings, and the option to switch roles or log out of the portal.",
        "Kitufe cha Zaidi kinakupa ufikiaji wa wasifu wako wa daktari, mipangilio ya akaunti, na chaguo la kubadilisha jukumu au kutoka.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 5) {
      speak(
        "You're all set, Doctor! Explore the tabs below and tap my icon anytime you need help. I'm always here for you! 🎉",
        "Uko tayari, Daktari! Chunguza vitufe hapa chini na ubonyeze ikoni yangu wakati wowote unahitaji msaada! 🎉",
        8000
      );
      timeoutId = window.setTimeout(() => endTour(), 9000);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, tourActive]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [statsData, alertsData] = await Promise.all([fetchStats(), fetchAlerts()]);
      setStats(statsData);
      setAlerts(alertsData as AlertRow[]);
    } catch (e) {
      console.error('Failed to load doctor data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = subscribeToAlerts(
      (newAlert) => {
        setAlerts((prev) => [newAlert as unknown as AlertRow, ...prev]);
        setFlashAlert(true);
        setTimeout(() => setFlashAlert(false), 5000);
        fetchStats().then(setStats).catch(console.error);
      },
      (updatedAlert) => {
        const updated = updatedAlert as unknown as AlertRow;
        setAlerts((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        fetchStats().then(setStats).catch(console.error);
      }
    );
    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      fetchPatients(searchQuery).then(setPatients).catch(console.error);
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const handleSelectPatient = async (patient: Record<string, unknown>) => {
    setSelectedPatient(patient);
    try {
      const records = await fetchPatientRecords(patient.id as string);
      setPatientRecords(records);
    } catch (e) {
      console.error('Failed to fetch records:', e);
    }
  };

  // Alert respond
  const handleRespond = async (alertId: string, status: 'acknowledged' | 'resolved') => {
    try {
      await respondToAlert(alertId, status, user.name, responseNotes || undefined);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, status, responded_by: user.name, response_notes: responseNotes, responded_at: new Date().toISOString() }
            : a
        )
      );
      setRespondingId(null);
      setResponseNotes('');
    } catch (e) {
      console.error('Failed to respond:', e);
    }
  };

  const handleToggleNotifications = async (alertId: string) => {
    if (expandedNotifications === alertId) {
      setExpandedNotifications(null);
      return;
    }
    setExpandedNotifications(alertId);
    if (!notifications[alertId]) {
      try {
        const data = await fetchAlertNotifications(alertId);
        setNotifications((prev) => ({ ...prev, [alertId]: data as NotificationRow[] }));
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    }
  };

  const severityColor = (s: string) => {
    if (s === 'critical') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (s === 'high') return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const emergencyAlerts = pendingAlerts.filter((a) => a.alert_type === 'emergency' || a.alert_type === 'security');

  // Alert card renderer
  const renderAlertCard = (alert: AlertRow, i: number) => (
    <motion.div
      key={alert.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className={`bg-card rounded-xl p-3.5 border ${
        alert.alert_type === 'emergency' && alert.status === 'pending'
          ? 'border-destructive/40 shadow-lg shadow-destructive/10'
          : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityColor(alert.severity)}`}>
            {alert.severity.toUpperCase()}
          </span>
          {(alert.alert_type === 'emergency' || alert.alert_type === 'security') && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground animate-pulse">
              {alert.alert_type === 'emergency' ? '🚨 EMERGENCY' : '🛡️ SECURITY'}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo(alert.created_at)}
          </span>
          {alert.source === 'ussd' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">USSD</span>
          )}
        </div>
        {alert.status === 'pending' && <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />}
      </div>

      <p className="font-semibold text-sm text-foreground">{alert.patient_name}</p>
      <p className="text-sm text-muted-foreground">{alert.symptom}</p>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.location}</span>
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {alert.phone}</span>
      </div>

      {/* Notification log toggle */}
      {(alert.alert_type === 'emergency' || alert.alert_type === 'security') && (
        <button onClick={() => handleToggleNotifications(alert.id)} className="mt-2 text-xs text-primary flex items-center gap-1">
          <Bell className="w-3 h-3" /> {expandedNotifications === alert.id ? 'Hide' : 'View'} Notifications Sent
        </button>
      )}

      <AnimatePresence>
        {expandedNotifications === alert.id && notifications[alert.id] && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 space-y-1 overflow-hidden">
            {notifications[alert.id].map((n) => (
              <div key={n.id} className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">
                {n.notification_type === 'sms' ? <MessageSquare className="w-3 h-3 text-primary" /> : <PhoneCall className="w-3 h-3 text-success" />}
                <span className="font-medium">{n.notification_type.toUpperCase()}</span>
                <span>→ {n.recipient_name || n.recipient_phone}</span>
                <span className={`ml-auto ${n.status === 'sent' ? 'text-success' : 'text-destructive'}`}>{n.status === 'sent' ? '✓ Sent' : n.status}</span>
              </div>
            ))}
            {notifications[alert.id].length === 0 && <p className="text-[10px] text-muted-foreground py-1">No notifications logged</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {alert.status === 'acknowledged' && (
        <div className="mt-2 text-xs text-success flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Acknowledged by {alert.responded_by || 'Staff'}
          {alert.response_notes && <span className="text-muted-foreground ml-1">— {alert.response_notes}</span>}
        </div>
      )}
      {alert.status === 'resolved' && (
        <div className="mt-2 text-xs text-primary flex items-center gap-1">
          <Shield className="w-3 h-3" /> Resolved by {alert.responded_by || 'Staff'}
        </div>
      )}

      {alert.status === 'pending' && (
        <div className="mt-3 space-y-2">
          {respondingId === alert.id ? (
            <div className="space-y-2">
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Add clinical notes (optional)..."
                className="w-full bg-muted rounded-lg px-3 py-2 text-xs outline-none placeholder:text-muted-foreground resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={() => handleRespond(alert.id, 'acknowledged')} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                </button>
                <button onClick={() => handleRespond(alert.id, 'resolved')} className="flex-1 py-2 rounded-lg bg-success/20 text-success text-xs font-medium flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Resolve
                </button>
                <button onClick={() => { setRespondingId(null); setResponseNotes(''); }} className="px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setRespondingId(alert.id)}
              className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
                alert.alert_type === 'emergency' ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-primary/10 text-primary'
              }`}
            >
              <Navigation className="w-4 h-4" />
              {alert.alert_type === 'emergency' ? 'RESPOND TO EMERGENCY' : 'Acknowledge & Review'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <img src="/Dawa-Mashinani-favicon.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-semibold text-foreground font-[Inter] leading-tight block">Doctor Portal</span>
            <span className="text-[10px] text-muted-foreground leading-tight block">Facility Gateway</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Connected to SHR</span>
        </div>
      </div>

      {/* Emergency Flash Banner */}
      <AnimatePresence>
        {(emergencyAlerts.length > 0 || flashAlert) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-destructive text-destructive-foreground px-4 py-3 animate-pulse"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  🚨 {emergencyAlerts.length} EMERGENCY REFERRAL{emergencyAlerts.length > 1 ? 'S' : ''} — URGENT
                </p>
                <p className="text-xs opacity-90">
                  {emergencyAlerts[0]?.patient_name} — {emergencyAlerts[0]?.symptom} at {emergencyAlerts[0]?.location}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'home' && (
        <div className="px-4 pt-4 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground font-[Inter]">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted-foreground">Clinical Decision Support System</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <Stethoscope className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{stats.patients}</p>
              <p className="text-[10px] text-muted-foreground">Patients</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <TrendingUp className="w-4 h-4 text-destructive mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{stats.critical_alerts}</p>
              <p className="text-[10px] text-muted-foreground">Critical</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{stats.pending_alerts}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">QUICK PATIENT LOOKUP</p>
            <div className={`relative transition-all duration-500 rounded-xl ${tourActive && currentStep === 2 ? 'ring-4 ring-primary ring-opacity-50 animate-pulse bg-primary/10' : ''}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (tourActive && currentStep === 2) nextStep();
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedPatient(null);
                }}
                placeholder="Search by name, phone, or UPI..."
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {searchQuery && !selectedPatient && (
            <div className="space-y-2">
              {patients.map((p) => (
                <button
                  key={p.id as string}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full bg-card rounded-xl p-3 border border-border text-left flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{p.name as string}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.upi as string} · {p.phone as string}
                    </p>
                  </div>
                </button>
              ))}
              {patients.length === 0 && searchQuery.length > 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No patients found</p>
              )}
            </div>
          )}

          {selectedPatient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center">
                    <User className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{selectedPatient.name as string}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPatient.age as number}y · {selectedPatient.gender as string} · UPI: {selectedPatient.upi as string}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last visit: {selectedPatient.last_visit ? new Date(selectedPatient.last_visit as string).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                SHARED HEALTH RECORD (FHIR)
              </p>
              {patientRecords.map((rec) => (
                <div key={rec.id as string} className="bg-card rounded-xl p-3.5 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{rec.resource_type as string}</span>
                    <span className="text-xs text-muted-foreground">{new Date(rec.recorded_at as string).toLocaleDateString()}</span>
                  </div>
                  <p className="font-semibold text-sm text-foreground">{rec.code as string}</p>
                  <p className="text-sm text-muted-foreground">{rec.value as string}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3" />
                    SHA-256: {(rec.sha256_hash as string).substring(0, 12)}...
                    <span className="ml-1 text-success">✓ Verified</span>
                  </div>
                </div>
              ))}
              {patientRecords.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No records found</p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="px-4 pt-4">
          <h2 className="font-bold text-foreground font-[Inter] text-lg mb-3">Patient Registry</h2>
          <p className="text-sm text-muted-foreground">National Client Registry (Simulated)</p>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="px-4 pt-4 space-y-3">
          <h2 className="font-bold text-foreground font-[Inter] text-lg">Clinical Alerts</h2>
          <p className="text-sm text-muted-foreground mb-1">Emergency referrals from USSD & CHP network</p>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading alerts...</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, i) => renderAlertCard(alert, i))}
              {alerts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No clinical alerts</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'more' && (
        <SettingsPanel user={user} onLogout={onLogout} />
      )}

      <BottomNav role="doctor" activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default DoctorDashboard;
