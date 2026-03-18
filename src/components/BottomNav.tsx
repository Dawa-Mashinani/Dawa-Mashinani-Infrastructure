import { Home, HeartHandshake, FileText, Pill, MoreHorizontal, AlertCircle, Users, Stethoscope } from 'lucide-react';
import { UserRole } from '@/lib/store';

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
