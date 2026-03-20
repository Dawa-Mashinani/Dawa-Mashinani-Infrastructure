import { useState } from 'react';
import { User, Moon, Sun, Monitor, Globe, Volume2, VolumeX, Bell, BellOff, Shield, Info, LogOut, ChevronRight, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';
import type { Language, Theme, VoiceType } from '@/components/msaidizi/MsaidiziProvider';

interface SettingsPanelProps {
  user: MockUser;
  onLogout: () => void;
}

const SettingsPanel = ({ user, onLogout }: SettingsPanelProps) => {
  const { language, setLanguage, theme, setTheme, voiceEnabled, setVoiceEnabled, voiceType, setVoiceType } = useMsaidizi();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const themeOptions: { value: Theme; label: string; labelSw: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', labelSw: 'Mwangaza', icon: Sun },
    { value: 'dark', label: 'Dark', labelSw: 'Giza', icon: Moon },
    { value: 'system', label: 'System', labelSw: 'Mfumo', icon: Monitor },
  ];

  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  ];

  const voiceOptions: { value: VoiceType; label: string; labelSw: string }[] = [
    { value: 'lady', label: 'Lady Voice', labelSw: 'Sauti ya Bibi' },
    { value: 'man', label: 'Man Voice', labelSw: 'Sauti ya Bwana' },
    { value: 'boy', label: 'Boy Voice', labelSw: 'Sauti ya Kijana' },
  ];

  const t = (en: string, sw: string) => language === 'en' ? en : sw;

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <h2 className="font-bold text-foreground font-[Inter] text-lg">
        {t('Settings', 'Mipangilio')}
      </h2>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.phone}</p>
            <p className="text-xs text-primary font-medium">{user.afyaId}</p>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium capitalize">
            {user.role}
          </span>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider px-1">
          {t('APPEARANCE', 'MUONEKANO')}
        </p>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Theme */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Palette className="w-4 h-4 text-primary" />
              {t('Theme', 'Mandhari')}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
                      theme === opt.value
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(opt.label, opt.labelSw)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Language */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              {t('Language', 'Lugha')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLanguage(opt.value)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    language === opt.value
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span className="text-base">{opt.flag}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sound & Notifications Section */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider px-1">
          {t('SOUND & NOTIFICATIONS', 'SAUTI NA ARIFA')}
        </p>
        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {/* Msaidizi Voice */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {voiceEnabled ? <Volume2 className="w-4.5 h-4.5 text-primary" /> : <VolumeX className="w-4.5 h-4.5 text-muted-foreground" />}
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{t('Msaidizi Voice', 'Sauti ya Msaidizi')}</p>
                <p className="text-xs text-muted-foreground">{t('Text-to-speech guide', 'Kiongozi cha kusoma maandishi')}</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${voiceEnabled ? 'bg-primary' : 'bg-muted'} flex items-center px-0.5`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${voiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Voice Type (only if voice enabled) */}
          <AnimatePresence>
            {voiceEnabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">{t('Voice Personality', 'Haiba ya Sauti')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {voiceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setVoiceType(opt.value)}
                        className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                          voiceType === opt.value
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-muted text-muted-foreground hover:bg-accent border border-transparent'
                        }`}
                      >
                        {t(opt.label, opt.labelSw)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {notificationsEnabled ? <Bell className="w-4.5 h-4.5 text-primary" /> : <BellOff className="w-4.5 h-4.5 text-muted-foreground" />}
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{t('Push Notifications', 'Arifa za Moja kwa Moja')}</p>
                <p className="text-xs text-muted-foreground">{t('Alert & health reminders', 'Arifa na vikumbusho vya afya')}</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-primary' : 'bg-muted'} flex items-center px-0.5`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Privacy & About Section */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground tracking-wider px-1">
          {t('PRIVACY & INFO', 'FARAGHA NA TAARIFA')}
        </p>
        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
          <button className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4.5 h-4.5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{t('Privacy & Security', 'Faragha na Usalama')}</p>
                <p className="text-xs text-muted-foreground">{t('Data encryption & consent', 'Usimbaji na idhini ya data')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => setShowAbout(!showAbout)} className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-4.5 h-4.5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{t('About Dawa Mashinani', 'Kuhusu Dawa Mashinani')}</p>
                <p className="text-xs text-muted-foreground">v0.1.0</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showAbout ? 'rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {showAbout && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-4 bg-muted/30 space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground text-sm">{t('Dawa Mashinani', 'Dawa Mashinani')}</p>
                  <p>{t(
                    'A digital health superhighway connecting rural communities to essential healthcare through AI-powered USSD, real-time alerts, and community health networks.',
                    'Njia kuu ya kidijitali ya afya inayounganisha jamii za vijijini na huduma muhimu za afya kupitia USSD inayoendeshwa na AI, arifa za wakati halisi, na mitandao ya afya ya jamii.'
                  )}</p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-primary font-medium">SHA-256 Secured</span>
                    <span className="text-primary font-medium">FHIR-Ready</span>
                  </div>
                  <p className="text-[10px] pt-1">© 2026 Dawa Mashinani. {t('All rights reserved.', 'Haki zote zimehifadhiwa.')}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full bg-destructive/10 text-destructive font-semibold rounded-2xl py-3.5 text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t('Switch Role / Logout', 'Badilisha Jukumu / Ondoka')}
      </button>
    </div>
  );
};

export default SettingsPanel;
