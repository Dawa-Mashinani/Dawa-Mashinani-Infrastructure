import { useState } from 'react';
import { User, Moon, Sun, Monitor, Globe, Volume2, VolumeX, Bell, BellOff, Shield, Info, LogOut, ChevronRight, Palette, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockUser } from '@/lib/store';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';
import type { Language, Theme, VoiceType } from '@/components/msaidizi/MsaidiziProvider';

interface SettingsPanelProps {
  user: MockUser;
  onLogout: () => void;
}

// Comprehensive translations
const TRANSLATIONS: Record<string, Record<Language, string>> = {
  'Settings': { en: 'Settings', sw: 'Mipangilio' },
  'APPEARANCE': { en: 'APPEARANCE', sw: 'MUONEKANO' },
  'Theme': { en: 'Theme', sw: 'Mandhari' },
  'Light': { en: 'Light', sw: 'Mwangaza' },
  'Dark': { en: 'Dark', sw: 'Giza' },
  'System': { en: 'System', sw: 'Mfumo' },
  'SOUND & NOTIFICATIONS': { en: 'SOUND & NOTIFICATIONS', sw: 'SAUTI NA ARIFA' },
  'Msaidizi Voice': { en: 'Msaidizi Voice', sw: 'Sauti ya Msaidizi' },
  'Text-to-speech guide': { en: 'Text-to-speech guide', sw: 'Kiongozi cha kusoma maandishi' },
  'Voice Personality': { en: 'Voice Personality', sw: 'Haiba ya Sauti' },
  'Lady Voice': { en: 'Lady Voice', sw: 'Sauti ya Bibi' },
  'Man Voice': { en: 'Man Voice', sw: 'Sauti ya Bwana' },
  'Boy Voice': { en: 'Boy Voice', sw: 'Sauti ya Kijana' },
  'Push Notifications': { en: 'Push Notifications', sw: 'Arifa za Moja kwa Moja' },
  'Alert & health reminders': { en: 'Alert & health reminders', sw: 'Arifa na vikumbusho vya afya' },
  'PRIVACY & INFO': { en: 'PRIVACY & INFO', sw: 'FARAGHA NA TAARIFA' },
  'Privacy & Security': { en: 'Privacy & Security', sw: 'Faragha na Usalama' },
  'Data encryption & consent': { en: 'Data encryption & consent', sw: 'Usimbaji na idhini ya data' },
  'About Dawa Mashinani': { en: 'About Dawa Mashinani', sw: 'Kuhusu Dawa Mashinani' },
  'Language': { en: 'Language', sw: 'Lugha' },
  'Switch Role / Logout': { en: 'Switch Role / Logout', sw: 'Badilisha Jukumu / Ondoka' },
  'Privacy Policy': { en: 'Privacy Policy', sw: 'Sera ya Faragha' },
  'Data Security': { en: 'Data Security', sw: 'Usalama wa Data' },
  'Your data is encrypted': { en: 'Your data is encrypted with SHA-256. We never sell or share your health information without explicit consent.', sw: 'Data yako imesimbwa na SHA-256. Hatuwezi kuuza au kushiriki taarifa yako ya afya bila idhini wazi.' },
  'We collect only': { en: 'We collect only essential health data to improve your care. You can delete your account anytime.', sw: 'Tunakusanya data ya afya tu inayohitajika kuboresha huduma yako. Unaweza kufuta akaunti yako wakati wowote.' },
  'Close': { en: 'Close', sw: 'Funga' },
  'Dawa Mashinani': { en: 'Dawa Mashinani', sw: 'Dawa Mashinani' },
  'Description': { en: 'A digital health superhighway connecting rural communities to essential healthcare through AI-powered USSD, real-time alerts, and community health networks.', sw: 'Njia kuu ya kidijitali ya afya inayounganisha jamii za vijijini na huduma muhimu za afya kupitia USSD inayoendeshwa na AI, arifa za wakati halisi, na mitandao ya afya ya jamii.' },
  'Health data is never shared': { en: 'Health data is never shared without consent', sw: 'Data ya afya haipatikani bila idhini' },
  'You can request data deletion': { en: 'You can request data deletion anytime', sw: 'Unaweza kuomba kufuta data wakati wowote' },
  'We comply with Kenya': { en: 'We comply with Kenya Health Data Protection Act', sw: 'Tunashikilia sheria za afya ya Kenya' },
  'All communications are encrypted': { en: 'All communications are encrypted end-to-end', sw: 'Ujumbe wote umesimbwa kwa mwisho wa mwisho' },
};

const t = (key: string, lang: Language): string => TRANSLATIONS[key]?.[lang] || key;

const SettingsPanel = ({ user, onLogout }: SettingsPanelProps) => {
  const { language, setLanguage, theme, setTheme, voiceEnabled, setVoiceEnabled, voiceType, setVoiceType } = useMsaidizi();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  ];

  const voiceOptions: { value: VoiceType; label: string }[] = [
    { value: 'lady', label: 'Lady Voice' },
    { value: 'man', label: 'Man Voice' },
    { value: 'boy', label: 'Boy Voice' },
  ];

  return (
    <>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <h2 className="font-bold text-foreground font-[Inter] text-lg">
          {t('Settings', language)}
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
            {t('APPEARANCE', language)}
          </p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Theme */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Palette className="w-4 h-4 text-primary" />
                {t('Theme', language)}
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
                      {t(opt.label, language)}
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
                {t('Language', language)}
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
            {t('SOUND & NOTIFICATIONS', language)}
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
                  <p className="text-sm font-medium text-foreground">{t('Msaidizi Voice', language)}</p>
                  <p className="text-xs text-muted-foreground">{t('Text-to-speech guide', language)}</p>
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
                  <div className="p-4 space-y-2 bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium">{t('Voice Personality', language)}</p>
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
                          {language === 'en' ? opt.label : opt.value === 'lady' ? 'Sauti ya Bibi' : opt.value === 'man' ? 'Sauti ya Bwana' : 'Sauti ya Kijana'}
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
                  <p className="text-sm font-medium text-foreground">{t('Push Notifications', language)}</p>
                  <p className="text-xs text-muted-foreground">{t('Alert & health reminders', language)}</p>
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
            {t('PRIVACY & INFO', language)}
          </p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <button
              onClick={() => setShowPrivacy(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4.5 h-4.5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{t('Privacy & Security', language)}</p>
                  <p className="text-xs text-muted-foreground">{t('Data encryption & consent', language)}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowAbout(!showAbout)} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-4.5 h-4.5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{t('About Dawa Mashinani', language)}</p>
                  <p className="text-xs text-muted-foreground">v0.1.0</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showAbout ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showAbout && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-muted/30 space-y-2 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground text-sm">{t('Dawa Mashinani', language)}</p>
                    <p>{t('Description', language)}</p>
                    <div className="flex items-center gap-3 pt-1 text-[10px] flex-wrap">
                      <span className="text-primary font-medium">SHA-256 Secured</span>
                      <span className="text-primary font-medium">FHIR-Ready</span>
                    </div>
                    <p className="text-[10px] pt-1">© 2026 Dawa Mashinani</p>
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
          {t('Switch Role / Logout', language)}
        </button>
      </div>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              initial={{ y: 500 }}
              animate={{ y: 0 }}
              exit={{ y: 500 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">{t('Privacy & Security', language)}</h3>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {t('Data Security', language)}
                  </h4>
                  <p className="text-sm text-muted-foreground">{t('Your data is encrypted', language)}</p>
                </div>

                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-2">
                    {t('Privacy Policy', language)}
                  </h4>
                  <p className="text-sm text-muted-foreground">{t('We collect only', language)}</p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• {t('Health data is never shared', language)}</p>
                  <p>• {t('You can request data deletion', language)}</p>
                  <p>• {t('We comply with Kenya', language)}</p>
                  <p>• {t('All communications are encrypted', language)}</p>
                </div>
              </div>

              <button
                onClick={() => setShowPrivacy(false)}
                className="w-full mt-6 bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm"
              >
                {t('Close', language)}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsPanel;
