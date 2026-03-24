import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

interface AppUser {
  name?: string;
  role?: string;
  phone?: string;
  afyaId?: string;
}

export type Language = 'en' | 'sw';
export type VoiceType = 'boy' | 'man' | 'lady';
export type Theme = 'light' | 'dark' | 'system';

interface MsaidiziState {
  enabled: boolean;
  language: Language;
  voiceEnabled: boolean;
  voiceType: VoiceType;
  theme: Theme;
  currentStep: number;
  totalSteps: number;
  isOpen: boolean;
  user: AppUser | null;
  currentMessage: { en: string; sw: string } | null;
  tourActive: boolean;
  
  setLanguage: (lang: Language) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVoiceType: (type: VoiceType) => void;
  setTheme: (theme: Theme) => void;
  setIsOpen: (isOpen: boolean) => void;
  setUser: (user: AppUser | null) => void;
  setTotalSteps: (steps: number) => void;
  speak: (textEn: string, textSw: string, autoCloseMs?: number, onDone?: () => void) => void;
  nextStep: () => void;
  startTour: () => void;
  endTour: () => void;
  activeView: string;
  activeRole: string;
  setActiveView: (view: string) => void;
  setActiveRole: (role: string) => void;
}

const MsaidiziContext = createContext<MsaidiziState | undefined>(undefined);

export const MsaidiziProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(true);
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('ms_lang') as Language) || 'en'
  );
  const [voiceEnabled, setVoiceEnabled] = useState(
    localStorage.getItem('ms_voice') !== 'false'
  );
  const [voiceType, setVoiceType] = useState<VoiceType>(
    (localStorage.getItem('ms_voicetype') as VoiceType) || 'lady'
  );
  const [theme, setThemeState] = useState<Theme>(
    (localStorage.getItem('ms_theme') as Theme) || 'light'
  );
  const [isOpen, setIsOpen] = useState(false);
  
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('ms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<{ en: string; sw: string } | null>(null);
  
  const autoCloseTimeoutRef = useRef<number | null>(null);
  const voicesRetryTimeoutRef = useRef<number | null>(null);
  const speakSessionRef = useRef(0);
  const speechUnlockedRef = useRef(false);
  const pendingSpeakRef = useRef<(() => void) | null>(null);
  const [activeView, setActiveView] = useState('landing');
  const [activeRole, setActiveRole] = useState('');

  useEffect(() => {
    const synth = window.speechSynthesis;
    const warmup = () => synth.getVoices();
    const unlock = () => {
      speechUnlockedRef.current = true;
      synth.resume();
      if (pendingSpeakRef.current) {
        const run = pendingSpeakRef.current;
        pendingSpeakRef.current = null;
        run();
      }
    };

    warmup();
    synth.addEventListener('voiceschanged', warmup);
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });

    return () => {
      synth.removeEventListener('voiceschanged', warmup);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      if (voicesRetryTimeoutRef.current) {
        window.clearTimeout(voicesRetryTimeoutRef.current);
        voicesRetryTimeoutRef.current = null;
      }
    };
  }, []);

  // Apply theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('ms_theme', t);
  };

  useEffect(() => {
    localStorage.setItem('ms_lang', language);
    localStorage.setItem('ms_voice', voiceEnabled.toString());
    localStorage.setItem('ms_voicetype', voiceType);
    if (user) {
      localStorage.setItem('ms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ms_user');
    }
  }, [language, voiceEnabled, voiceType, user]);

  const speak = (textEn: string, textSw: string, autoCloseMs?: number, onDone?: () => void) => {
    speakSessionRef.current += 1;
    const sessionId = speakSessionRef.current;
    let doneCalled = false;
    const finish = () => {
      if (doneCalled || sessionId !== speakSessionRef.current) return;
      doneCalled = true;
      if (onDone) onDone();
    };

    setCurrentMessage({ en: textEn, sw: textSw });
    setIsOpen(true);
    
    if (autoCloseTimeoutRef.current) {
      window.clearTimeout(autoCloseTimeoutRef.current);
    }

    if (autoCloseMs) {
      autoCloseTimeoutRef.current = window.setTimeout(() => {
        if (sessionId !== speakSessionRef.current) return;
        setIsOpen(false);
        setCurrentMessage(null);
        finish();
      }, autoCloseMs);
    }
    
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    // Strip emoji so TTS doesn't read them as descriptions like "smile emoji"
    const rawText = language === 'en' ? textEn : textSw;
    // eslint-disable-next-line no-misleading-character-class
    const text = rawText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{FE0F}]/gu, '').replace(/\s{2,}/g, ' ').trim();

    const speakNow = () => {
      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const langMatch = language === 'sw' ? 'sw' : 'en';
      const availableVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langMatch));
      let selectedVoice = availableVoices[0] || voices.find(v => v.lang.toLowerCase().includes('en'));

      if (voiceType === 'boy') {
        utterance.pitch = 1.4;
        utterance.rate = 1.15;
        const boyVoice = availableVoices.find(v =>
          v.name.toLowerCase().includes('junior') ||
          v.name.toLowerCase().includes('child') ||
          v.name.toLowerCase().includes('boy')
        );
        if (boyVoice) selectedVoice = boyVoice;
      } else if (voiceType === 'man') {
        utterance.pitch = 0.75;
        utterance.rate = 0.85;
        const maleVoice = availableVoices.find(v =>
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('man')
        );
        if (maleVoice) selectedVoice = maleVoice;
      } else {
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
        const femaleVoice = availableVoices.find(v =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('woman') ||
          v.name.toLowerCase().includes('lady')
        );
        if (femaleVoice) selectedVoice = femaleVoice;
      }

      utterance.lang = language === 'sw' ? 'sw-KE' : 'en-US';
      utterance.volume = 1;
      utterance.onend = finish;
      utterance.onerror = finish;
      if (selectedVoice) utterance.voice = selectedVoice;

      synth.speak(utterance);
    };

    const synth = window.speechSynthesis;
    if (!speechUnlockedRef.current) {
      speechUnlockedRef.current = true;
    }

    if (synth.getVoices().length > 0) {
      speakNow();
      return;
    }

    const onVoicesChanged = () => {
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      speakNow();
    };

    synth.addEventListener('voiceschanged', onVoicesChanged);
    if (voicesRetryTimeoutRef.current) {
      window.clearTimeout(voicesRetryTimeoutRef.current);
    }
    voicesRetryTimeoutRef.current = window.setTimeout(() => {
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      speakNow();
      voicesRetryTimeoutRef.current = null;
    }, 700);
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const startTour = () => {
    if (!voiceEnabled) setVoiceEnabled(true);
    setTourActive(true);
    setCurrentStep(1);
  };
  const endTour = () => {
    setTourActive(false);
    setCurrentStep(0);
    setIsOpen(false);
    setCurrentMessage(null);
    setTotalSteps(0);
    window.speechSynthesis.cancel();
    if (autoCloseTimeoutRef.current) {
      window.clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
  };

  return (
    <MsaidiziContext.Provider value={{
      enabled, language, voiceEnabled, voiceType, theme, currentStep, totalSteps, isOpen, user, currentMessage, tourActive, activeView, activeRole,
      setLanguage, setVoiceEnabled, setVoiceType, setTheme, setIsOpen, setUser, setTotalSteps, speak, nextStep, startTour, endTour, setActiveView, setActiveRole
    }}>
      {children}
    </MsaidiziContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMsaidizi = () => {
  const context = useContext(MsaidiziContext);
  if (!context) throw new Error('useMsaidizi must be used within MsaidiziProvider');
  return context;
};
