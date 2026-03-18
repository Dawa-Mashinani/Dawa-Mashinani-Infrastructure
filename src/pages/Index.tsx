import { useState } from 'react';
import { Shield, Stethoscope, Users, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole, MOCK_USERS } from '@/lib/store';
import PatientHome from '@/components/PatientHome';
import CHPDashboard from '@/components/CHPDashboard';
import DoctorDashboard from '@/components/DoctorDashboard';

const ROLES: { id: UserRole; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'patient', label: 'Patient', desc: 'Access Rafiki AI, Jirani Ledger & Afya ID', icon: User },
  { id: 'chp', label: 'Community Health Promoter', desc: 'Mlinzi alerts & referral tracking', icon: Users },
  { id: 'doctor', label: 'Doctor', desc: 'EMR gateway & clinical decision support', icon: Stethoscope },
];

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  if (selectedRole) {
    const user = MOCK_USERS[selectedRole];
    const onLogout = () => setSelectedRole(null);

    if (selectedRole === 'patient') return <PatientHome user={user} onLogout={onLogout} />;
    if (selectedRole === 'chp') return <CHPDashboard user={user} onLogout={onLogout} />;
    return <DoctorDashboard user={user} onLogout={onLogout} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-[Inter]">Dawa Mashinani</h1>
          <p className="text-sm text-muted-foreground">
            Digital Health Superhighway — Proof of Concept
          </p>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground tracking-wide text-center">SELECT YOUR ROLE</p>
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => setSelectedRole(role.id)}
                className="w-full bg-card rounded-xl p-4 border border-border text-left flex items-center gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{role.label}</p>
                  <p className="text-xs text-muted-foreground">{role.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          PoC Demo · SHA-256 Secured · FHIR-Ready · Zero-Trust Architecture
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
