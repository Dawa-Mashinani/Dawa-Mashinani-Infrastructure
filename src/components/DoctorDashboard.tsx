import { useState, useEffect } from 'react';
import { Search, User, Clock, CheckCircle2, AlertCircle, Clipboard, Stethoscope, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { fetchPatients, fetchPatientRecords, fetchStats } from '@/lib/api';
import BottomNav from './BottomNav';

interface DoctorDashboardProps {
  user: MockUser;
  onLogout: () => void;
}

const DoctorDashboard = ({ user, onLogout }: DoctorDashboardProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ patients: 0, critical_alerts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats().then((s) => {
      setStats(s);
      setLoading(false);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      fetchPatients(searchQuery).then(setPatients).catch(console.error);
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    try {
      const records = await fetchPatientRecords(patient.id);
      setPatientRecords(records);
    } catch (e) {
      console.error('Failed to fetch records:', e);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div>
          <span className="font-semibold text-foreground font-[Inter]">Doctor Portal</span>
          <p className="text-xs text-muted-foreground">Facility Gateway</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Connected to SHR</span>
        </div>
      </div>

      {activeTab === 'home' && (
        <div className="px-4 pt-4 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-foreground font-[Inter]">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted-foreground">Clinical Decision Support System</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card rounded-xl p-3.5 border border-border">
              <Stethoscope className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.patients}</p>
              <p className="text-[10px] text-muted-foreground">Registered Patients</p>
            </div>
            <div className="bg-card rounded-xl p-3.5 border border-border">
              <TrendingUp className="w-5 h-5 text-destructive mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.critical_alerts}</p>
              <p className="text-[10px] text-muted-foreground">Critical Alerts</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground tracking-wide mb-2">QUICK PATIENT LOOKUP</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
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
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full bg-card rounded-xl p-3 border border-border text-left flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.upi} · {p.phone}
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
                    <p className="font-bold text-foreground">{selectedPatient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPatient.age}y · {selectedPatient.gender} · UPI: {selectedPatient.upi}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last visit: {selectedPatient.last_visit ? new Date(selectedPatient.last_visit).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                SHARED HEALTH RECORD (FHIR)
              </p>
              {patientRecords.map((rec) => (
                <div key={rec.id} className="bg-card rounded-xl p-3.5 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{rec.resource_type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(rec.recorded_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-semibold text-sm text-foreground">{rec.code}</p>
                  <p className="text-sm text-muted-foreground">{rec.value}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3" />
                    SHA-256: {rec.sha256_hash.substring(0, 12)}...
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
        <div className="px-4 pt-4">
          <h2 className="font-bold text-foreground font-[Inter] text-lg mb-3">Clinical Alerts</h2>
          <p className="text-sm text-muted-foreground">Critical referrals from USSD & CHP network</p>
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

      <BottomNav role="doctor" activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default DoctorDashboard;
