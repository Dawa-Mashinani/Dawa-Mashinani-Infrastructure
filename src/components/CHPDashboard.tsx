import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle, User, Phone, MessageSquare, PhoneCall, Bell, Shield, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { fetchAlerts, respondToAlert, fetchAlertNotifications, fetchStats, subscribeToAlerts } from '@/lib/api';
import BottomNav from './BottomNav';
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

interface CHPDashboardProps {
  user: MockUser;
  onLogout: () => void;
}

const CHPDashboard = ({ user, onLogout }: CHPDashboardProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [stats, setStats] = useState({ pending_alerts: 0, total_alerts: 0, critical_alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | 'emergency' | 'medical'>('all');
  const [expandedNotifications, setExpandedNotifications] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Record<string, NotificationRow[]>>({});
  const [flashAlert, setFlashAlert] = useState(false);

  const { speak, currentStep, tourActive, nextStep, startTour, endTour, setTotalSteps, setActiveView, setActiveRole } = useMsaidizi();

  // Sync active view for context-aware MsaidiziGuide
  useEffect(() => {
    setActiveRole('chp');
    setActiveView(activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Start CHP Tour
    const t1 = setTimeout(() => {
      setTotalSteps(5);
      startTour();
    }, 1500);
    return () => clearTimeout(t1);
  }, []);

  // Tour Controller
  useEffect(() => {
    if (!tourActive) return;

    let timeoutId: number;

    if (currentStep === 1) {
      speak(
        `Jambo ${user.name.split(' ')[0]}! Welcome to your CHP Console. Allow me to guide you through your field dashboard.`,
        `Jambo ${user.name.split(' ')[0]}! Karibu kwenye dashibodi yako ya CHP. Wacha nikuonyeshe jinsi inavyofanya kazi.`,
        8000
      );
      timeoutId = window.setTimeout(() => nextStep(), 9000);
    } else if (currentStep === 2) {
      speak(
        "This is your Alerts section. Here you see incoming reports from patients via USSD and the app. Emergency alerts flash red and include details of who was notified — neighbors and CHPs.",
        "Hii ni sehemu yako ya Arifa. Hapa unaona ripoti zinazoingia kutoka kwa wagonjwa kupitia USSD na programu. Arifa za dharura zinaangaza na kuonyesha nani aliyearifiwa.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 3) {
      speak(
        "Next is the Referral Tracker — here you can track household follow-up visits synced with eCHIS and ensure patients are receiving the care they were referred for.",
        "Ifuatayo ni Kifuatiliaji cha Rufaa — hapa unaweza kufuatilia ziara za ufuatiliaji wa kaya zilizosawazishwa na eCHIS na kuhakikisha wagonjwa wanapata huduma.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 4) {
      speak(
        "The More tab gives you access to your CHP profile, account settings, and the option to switch roles or log out of the system.",
        "Kitufe cha Zaidi kinakupa ufikiaji wa wasifu wako wa CHP, mipangilio ya akaunti, na chaguo la kubadilisha jukumu au kutoka.",
        12000
      );
      timeoutId = window.setTimeout(() => nextStep(), 13000);
    } else if (currentStep === 5) {
      speak(
        "You're all set! Explore the tabs below and tap my icon anytime you need help. Together we keep the community healthy! 🎉",
        "Uko tayari! Chunguza vitufe hapa chini na ubonyeze ikoni yangu wakati wowote. Pamoja tunalinda afya ya jamii! 🎉",
        8000
      );
      timeoutId = window.setTimeout(() => endTour(), 9000);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [currentStep, tourActive]);

  // Initial data load
  const loadData = useCallback(async () => {
    try {
      const [alertsData, statsData] = await Promise.all([fetchAlerts(), fetchStats()]);
      setAlerts(alertsData as AlertRow[]);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load CHP data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime subscription for instant alert updates
  useEffect(() => {
    const channel = subscribeToAlerts(
      // On new alert
      (newAlert) => {
        setAlerts((prev) => [newAlert as unknown as AlertRow, ...prev]);
        setFlashAlert(true);
        setTimeout(() => setFlashAlert(false), 5000);
        // Refresh stats
        fetchStats().then(setStats).catch(console.error);
      },
      // On alert update
      (updatedAlert) => {
        const updated = updatedAlert as unknown as AlertRow;
        setAlerts((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        fetchStats().then(setStats).catch(console.error);
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Respond to alert
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

  // Load notifications for an alert
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

  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === 'emergency') return a.alert_type === 'emergency' || a.alert_type === 'security';
    if (alertFilter === 'medical') return a.alert_type === 'medical';
    return true;
  });

  // Shared alert card renderer
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
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityColor(alert.severity)}`}
          >
            {alert.severity.toUpperCase()}
          </span>
          {(alert.alert_type === 'emergency' || alert.alert_type === 'security') && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground animate-pulse">
              {alert.alert_type === 'emergency' ? '🚨 EMERGENCY' : '🛡️ SECURITY'}
            </span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(alert.created_at)}
          </span>
          {alert.source === 'ussd' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-medium">
              USSD
            </span>
          )}
        </div>
        {alert.status === 'pending' && (
          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
        )}
      </div>

      {/* Patient Info */}
      <p className="font-semibold text-sm text-foreground">{alert.patient_name}</p>
      <p className="text-sm text-muted-foreground">{alert.symptom}</p>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {alert.location}
        </span>
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" /> {alert.phone}
        </span>
      </div>

      {/* Notification toggle for emergency alerts */}
      {(alert.alert_type === 'emergency' || alert.alert_type === 'security') && (
        <button
          onClick={() => handleToggleNotifications(alert.id)}
          className="mt-2 text-xs text-primary flex items-center gap-1"
        >
          <Bell className="w-3 h-3" />
          {expandedNotifications === alert.id ? 'Hide' : 'View'} Notifications Sent
        </button>
      )}

      {/* Notification log */}
      <AnimatePresence>
        {expandedNotifications === alert.id && notifications[alert.id] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {notifications[alert.id].map((n) => (
              <div key={n.id} className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">
                {n.notification_type === 'sms' ? (
                  <MessageSquare className="w-3 h-3 text-primary" />
                ) : (
                  <PhoneCall className="w-3 h-3 text-success" />
                )}
                <span className="font-medium">{n.notification_type.toUpperCase()}</span>
                <span>→ {n.recipient_name || n.recipient_phone}</span>
                <span className={`ml-auto ${n.status === 'sent' ? 'text-success' : 'text-destructive'}`}>
                  {n.status === 'sent' ? '✓ Sent' : n.status}
                </span>
              </div>
            ))}
            {notifications[alert.id].length === 0 && (
              <p className="text-[10px] text-muted-foreground py-1">No notifications logged</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response status */}
      {alert.status === 'acknowledged' && (
        <div className="mt-2 text-xs text-success flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Acknowledged by {alert.responded_by || 'CHP'}
          {alert.response_notes && <span className="text-muted-foreground ml-1">— {alert.response_notes}</span>}
        </div>
      )}
      {alert.status === 'resolved' && (
        <div className="mt-2 text-xs text-primary flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Resolved by {alert.responded_by || 'CHP'}
        </div>
      )}

      {/* Action buttons */}
      {alert.status === 'pending' && (
        <div className="mt-3 space-y-2">
          {respondingId === alert.id ? (
            <div className="space-y-2">
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Add response notes (optional)..."
                className="w-full bg-muted rounded-lg px-3 py-2 text-xs outline-none placeholder:text-muted-foreground resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(alert.id, 'acknowledged')}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                </button>
                <button
                  onClick={() => handleRespond(alert.id, 'resolved')}
                  className="flex-1 py-2 rounded-lg bg-success/20 text-success text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" /> Resolve
                </button>
                <button
                  onClick={() => { setRespondingId(null); setResponseNotes(''); }}
                  className="px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setRespondingId(alert.id)}
              className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
                alert.alert_type === 'emergency'
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              <Navigation className="w-4 h-4" />
              {alert.alert_type === 'emergency' ? 'RESPOND TO EMERGENCY' : 'Acknowledge & Navigate'}
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
            <span className="font-semibold text-foreground font-[Inter] leading-tight block">CHP Dashboard</span>
            <span className="text-[10px] text-muted-foreground leading-tight block">Mlinzi Alert System</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
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
                  🚨 {emergencyAlerts.length} EMERGENCY ALERT{emergencyAlerts.length > 1 ? 'S' : ''} — RESPOND NOW
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
              Hello, {user.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {pendingAlerts.length} pending alerts in your area
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Pending', value: pendingAlerts.length, color: 'text-destructive' },
              { label: 'Emergency', value: emergencyAlerts.length, color: 'text-orange-500' },
              { label: 'Total Today', value: alerts.length, color: 'text-foreground' },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl p-3 border border-border text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">RECENT ALERTS</p>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading alerts...</p>
            ) : (
              <div
                className={`space-y-2 transition-all duration-500 rounded-xl p-2 ${
                  tourActive && currentStep === 2 ? 'ring-4 ring-primary ring-opacity-50 animate-pulse bg-primary/5' : ''
                }`}
              >
                {alerts.slice(0, 5).map((alert, i) => renderAlertCard(alert, i))}
                {alerts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No alerts yet</p>
                )}
                {alerts.length > 5 && (
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="w-full py-2 text-sm text-primary font-medium text-center"
                  >
                    View all {alerts.length} alerts →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="px-4 pt-4 space-y-3">
          <h2 className="font-bold text-foreground font-[Inter] text-lg">All Alerts</h2>
          <p className="text-sm text-muted-foreground mb-1">Real-time triage feed from USSD & App</p>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['all', 'emergency', 'medical'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setAlertFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  alertFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'emergency' ? '🚨 Emergency' : '🏥 Medical'}
                {filter === 'all' && ` (${alerts.length})`}
                {filter === 'emergency' &&
                  ` (${alerts.filter((a) => a.alert_type === 'emergency' || a.alert_type === 'security').length})`}
                {filter === 'medical' && ` (${alerts.filter((a) => a.alert_type === 'medical').length})`}
              </button>
            ))}
          </div>

          {/* Alert list */}
          <div className="space-y-2">
            {filteredAlerts.map((alert, i) => renderAlertCard(alert, i))}
            {filteredAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No alerts match this filter</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="px-4 pt-4">
          <h2 className="font-bold text-foreground font-[Inter] text-lg mb-3">Referral Tracker</h2>
          <p className="text-sm text-muted-foreground">Household follow-up visits synced with eCHIS</p>
        </div>
      )}

      {activeTab === 'more' && (
        <div className="px-4 pt-4 space-y-3">
          <h2 className="font-bold text-foreground font-[Inter] text-lg">Settings</h2>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <User className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.afyaId}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full p-4 text-left text-sm text-destructive">
              Switch Role / Logout
            </button>
          </div>
        </div>
      )}

      <BottomNav role="chp" activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default CHPDashboard;
