import { Home, HeartHandshake, FileText, Pill, MoreHorizontal, AlertCircle, Users, Stethoscope } from 'lucide-react';
import { UserRole } from '@/lib/store';
import { useMsaidizi } from './msaidizi/MsaidiziProvider';

interface BottomNavProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const PATIENT_TABS = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'rafiki', label: 'RAFIKI', icon: HeartHandshake },
  { id: 'jirani', label: 'JIRANI', icon: FileText },
  { id: 'mlinzi', label: 'MLINZI', icon: Pill },
  { id: 'more', label: 'MORE', icon: MoreHorizontal },
];

const CHP_TABS = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'alerts', label: 'ALERTS', icon: AlertCircle },
  { id: 'referrals', label: 'REFERRALS', icon: Users },
  { id: 'more', label: 'MORE', icon: MoreHorizontal },
];

const DOCTOR_TABS = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'patients', label: 'PATIENTS', icon: Stethoscope },
  { id: 'alerts', label: 'ALERTS', icon: AlertCircle },
  { id: 'more', label: 'MORE', icon: MoreHorizontal },
];

const BottomNav = ({ role, activeTab, onTabChange }: BottomNavProps) => {
  const tabs = role === 'patient' ? PATIENT_TABS : role === 'chp' ? CHP_TABS : DOCTOR_TABS;
  const { currentStep, tourActive } = useMsaidizi();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-[90]">
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          // Highlight the tab that matches what MsaidiziGuide is CURRENTLY explaining
          let isHighlighted = false;
          if (tourActive) {
            // Patient: step2=Rafiki, step3=Jirani, step4=Mlinzi, step5=More
            if (role === 'patient' && currentStep === 2 && tab.id === 'rafiki') isHighlighted = true;
            if (role === 'patient' && currentStep === 3 && tab.id === 'jirani') isHighlighted = true;
            if (role === 'patient' && currentStep === 4 && tab.id === 'mlinzi') isHighlighted = true;
            if (role === 'patient' && currentStep === 5 && tab.id === 'more') isHighlighted = true;
            // CHP: step2=Alerts, step3=Referrals, step4=More
            if (role === 'chp' && currentStep === 2 && tab.id === 'alerts') isHighlighted = true;
            if (role === 'chp' && currentStep === 3 && tab.id === 'referrals') isHighlighted = true;
            if (role === 'chp' && currentStep === 4 && tab.id === 'more') isHighlighted = true;
            // Doctor: step2=Patients, step3=Alerts, step4=More
            if (role === 'doctor' && currentStep === 2 && tab.id === 'patients') isHighlighted = true;
            if (role === 'doctor' && currentStep === 3 && tab.id === 'alerts') isHighlighted = true;
            if (role === 'doctor' && currentStep === 4 && tab.id === 'more') isHighlighted = true;
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              } ${isHighlighted ? 'ring-4 ring-primary ring-opacity-60 bg-primary/20 animate-pulse !text-primary transform -translate-y-2' : ''}`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-medium tracking-wide">
                {tab.label}
              </span>
              {isActive && !isHighlighted && <div className="w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
