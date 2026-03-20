import { useState, useEffect } from 'react';
import { Shield, Stethoscope, Users, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole, MOCK_USERS, MockUser } from '@/lib/store';
import PatientHome from '@/components/PatientHome';
import CHPDashboard from '@/components/CHPDashboard';
import DoctorDashboard from '@/components/DoctorDashboard';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';

const ROLES: { id: UserRole; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'patient', label: 'Patient', desc: 'Access Rafiki AI, Jirani Ledger & Afya ID', icon: User },
  { id: 'chp', label: 'Community Health Promoter', desc: 'Mlinzi alerts & referral tracking', icon: Users },
  { id: 'doctor', label: 'Doctor', desc: 'EMR gateway & clinical decision support', icon: Stethoscope },
];

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { user, setUser, speak, language, setActiveView, setActiveRole } = useMsaidizi();

  // Sync active view for context-aware MsaidiziGuide
  useEffect(() => {
    if (!user) {
      setActiveRole('');
      setActiveView(selectedRole ? 'login' : 'landing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, user]);

  // Landing page welcome message
  useEffect(() => {
    if (!user && !selectedRole) {
      setTimeout(() => {
        speak(
          "Welcome! 😊 I'm Msaidizi, your guide. Choose a role below to explore.",
          "Karibu! 😊 Mimi ni Msaidizi, kiongozi wako. Chagua jukumu hapa chini.",
          6000
        );
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user) {
    const onLogout = () => {
      setUser(null);
      setSelectedRole(null);
    };

    if (user.role === 'patient') return <PatientHome user={user} onLogout={onLogout} />;
    if (user.role === 'chp') return <CHPDashboard user={user} onLogout={onLogout} />;
    return <DoctorDashboard user={user} onLogout={onLogout} />;
  }

  const handleRoleSelect = (roleId: UserRole) => {
    setSelectedRole(roleId);
    speak(
      "Please fill in your details. All fields are required.",
      "Tafadhali jaza maelezo yako. Sehemu zote zinahitajika.",
      5000
    );
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('fullName') as string || '').trim();
    const idNum = (formData.get('idNum') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();

    const errors: Record<string, string> = {};

    // Full Name: required, text only (letters, spaces, hyphens, apostrophes)
    if (!name) {
      errors.fullName = 'Full name is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(name)) {
      errors.fullName = 'Name must contain only letters';
    } else if (name.length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }

    // ID / License: required, alphanumeric
    if (!idNum) {
      errors.idNum = 'ID / License number is required';
    } else if (!/^[A-Za-z0-9/'-]+$/.test(idNum)) {
      errors.idNum = 'Must be alphanumeric (letters and numbers only)';
    }

    // Phone: required for patients, must look like a Kenyan phone number
    if (selectedRole === 'patient') {
      if (!phone) {
        errors.phone = 'Phone number is required';
      } else if (!/^(\+?254|0)\d{9}$/.test(phone.replace(/\s/g, ''))) {
        errors.phone = 'Enter a valid phone (e.g. 0712345678 or +254712345678)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    
    const newUser: MockUser = {
      ...MOCK_USERS[selectedRole!],
      name,
      role: selectedRole!,
    };
    
    setUser(newUser);
    
    const isDoctor = selectedRole === 'doctor';
    setTimeout(() => {
      speak(
        isDoctor ? `Welcome, Dr. ${name}. Let me show you around the portal.` : `Welcome, ${name} 👋 Let me show you around.`,
        isDoctor ? `Karibu, Daktari ${name}. Wacha nikuonyeshe jinsi mfumo huu unavyofanya kazi.` : `Habari ${name}, karibu tena 😊 Wacha nikuongoze.`,
        4000
      );
    }, 500);
  };

  if (selectedRole) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm"
        >
          <button 
            onClick={() => setSelectedRole(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back to roles
          </button>
          
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-1 capitalize">{selectedRole} Login</h2>
            <p className="text-sm text-muted-foreground mb-6">Secure authentication — all fields validated</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  required
                  minLength={2}
                  placeholder="e.g. Norman"
                  pattern="[A-Za-z\s'\-]+"
                  title="Letters only — no numbers or symbols"
                  onChange={() => setFormErrors(prev => { const { fullName: _, ...rest } = prev; return rest; })}
                  className={`w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary ${formErrors.fullName ? 'border-destructive' : 'border-border'}`}
                />
                {formErrors.fullName && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.fullName}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID / License Number</label>
                <input 
                  type="text" 
                  name="idNum"
                  required
                  placeholder={selectedRole === 'doctor' ? 'e.g. DOC-12345' : 'e.g. 12345678'}
                  pattern="[A-Za-z0-9\-\/]+"
                  title="Alphanumeric characters only"
                  onChange={() => setFormErrors(prev => { const { idNum: _, ...rest } = prev; return rest; })}
                  className={`w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary ${formErrors.idNum ? 'border-destructive' : 'border-border'}`}
                />
                {formErrors.idNum && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.idNum}</p>
                )}
              </div>

              {selectedRole === 'patient' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone Number</label>
                  <input 
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. 0712345678"
                    pattern="(\+?254|0)\d{9}"
                    title="Enter a valid Kenyan phone number"
                    onChange={() => setFormErrors(prev => { const { phone: _, ...rest } = prev; return rest; })}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary ${formErrors.phone ? 'border-destructive' : 'border-border'}`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.phone}</p>
                  )}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-primary text-primary-foreground font-semibold rounded-lg py-3 mt-4 text-sm hover:opacity-90 transition-opacity"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-start pt-16 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <div className="w-64 max-h-48 mx-auto -mb-4 flex items-center justify-center">
            <img 
              src="/Dawa-Mashinani-black.svg" 
              alt="Dawa Mashinani Startup Logo" 
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="space-y-1 relative z-10">
            <h1 className="text-2xl font-bold text-foreground font-[Inter]">Dawa Mashinani</h1>
            <p className="text-sm text-muted-foreground">
              Digital Health Superhighway — Proof of Concept
            </p>
          </div>
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
                onClick={() => handleRoleSelect(role.id)}
                className="w-full bg-card rounded-xl p-4 border border-border text-left flex items-center gap-3 hover:border-primary/30 transition-colors tour-role-btn"
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
          Empowering Rural Healthcare · One Village at a Time 🌍
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
