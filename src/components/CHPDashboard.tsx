import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle, User, Navigation, AlertCircle, Route } from 'lucide-react';
import { motion } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { fetchAlerts, acknowledgeAlertAPI, fetchStats } from '@/lib/api';
import BottomNav from './BottomNav';

interface CHPDashboardProps {
  user: MockUser;
  onLogout: () => void;
}

const CHPDashboard = ({ user, onLogout }: CHPDashboardProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending_alerts: 0, total_alerts: 0, critical_alerts: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [alertsData, statsData] = await Promise.all([fetchAlerts(), fetchStats()]);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load CHP data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll for new alerts every 10s (simulates real-time)
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlertAPI(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a)));
    } catch (e) {
      console.error('Failed to acknowledge:', e);
    }
  };

  const severityColor = (s: string) => {
    if (s === 'critical') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (s === 'high') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const acknowledgedAlerts = alerts.filter((a) => a.status === 'acknowledged');

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div>
          <span className="font-semibold text-foreground font-[Inter]">CHP Dashboard</span>
          <p className="text-xs text-muted-foreground">Mlinzi Alert System</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

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
              { label: 'Acknowledged', value: acknowledgedAlerts.length, color: 'text-warning' },
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
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl p-3.5 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(alert.created_at)}
                        </span>
                        {alert.source === 'ussd' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">USSD</span>
                        )}
                      </div>
                      {alert.status === 'pending' && (
                        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      )}
                    </div>
                    <p className="font-semibold text-sm text-foreground">{alert.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{alert.symptom}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {alert.location}
                    </div>
                    {alert.status === 'pending' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="mt-3 w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Acknowledge & Navigate
                      </button>
                    )}
                    {alert.status === 'acknowledged' && (
                      <p className="mt-2 text-xs text-success flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Acknowledged
                      </p>
                    )}
                  </motion.div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No alerts yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="px-4 pt-4">
          <h2 className="font-bold text-foreground font-[Inter] text-lg mb-3">All Alerts</h2>
          <p className="text-sm text-muted-foreground">Real-time triage feed from USSD & App reports</p>
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
