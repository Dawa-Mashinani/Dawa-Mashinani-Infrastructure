import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { MockUser } from '@/lib/store';

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
  user: MockUser | null;
  currentMessage: { en: string; sw: string } | null;
  tourActive: boolean;
  
  setLanguage: (lang: Language) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVoiceType: (type: VoiceType) => void;
  setTheme: (theme: Theme) => void;
  setIsOpen: (isOpen: boolean) => void;
  setUser: (user: MockUser | null) => void;
  setTotalSteps: (steps: number) => void;
  speak: (textEn: string, textSw: string, autoCloseMs?: number) => void;
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
  
  const [user, setUser] = useState<MockUser | null>(() => {
    const saved = localStorage.getItem('ms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<{ en: string; sw: string } | null>(null);
  
  const autoCloseTimeoutRef = useRef<number | null>(null);
  const [activeView, setActiveView] = useState('landing');
  const [activeRole, setActiveRole] = useState('');

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

  const speak = (textEn: string, textSw: string, autoCloseMs?: number) => {
    setCurrentMessage({ en: textEn, sw: textSw });
    setIsOpen(true);
    
    if (autoCloseTimeoutRef.current) {
      window.clearTimeout(autoCloseTimeoutRef.current);
    }

    if (autoCloseMs) {
      autoCloseTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
        setCurrentMessage(null);
      }, autoCloseMs);
    }
    
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();
    
    // Strip emoji so TTS doesn't read them as descriptions like "smile emoji"
    const rawText = language === 'en' ? textEn : textSw;
    // eslint-disable-next-line no-misleading-character-class
    const text = rawText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{FE0F}]/gu, '').replace(/\s{2,}/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const langMatch = language === 'sw' ? 'sw' : 'en';
    
    // Filter voices by language
    const availableVoices = voices.filter(v => v.lang.startsWith(langMatch));
    let selectedVoice = availableVoices[0] || voices.find(v => v.lang.includes('en'));

    // Voice personality selection with distinct characteristics
    if (voiceType === 'boy') {
      utterance.pitch = 1.4;  // Higher pitch for boy
      utterance.rate = 1.15;  // Slightly faster for energetic boy voice
      // Try to find a boy/child voice if available
      const boyVoice = availableVoices.find(v => 
        v.name.toLowerCase().includes('junior') || 
        v.name.toLowerCase().includes('child') ||
        v.name.toLowerCase().includes('boy')
      );
      if (boyVoice) selectedVoice = boyVoice;
    } else if (voiceType === 'man') {
      utterance.pitch = 0.75;  // Lower pitch for man
      utterance.rate = 0.85;   // Slower for deeper man voice
      // Try to find a male voice
      const maleVoice = availableVoices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('alex') ||
        v.name.toLowerCase().includes('man')
      );
      if (maleVoice) selectedVoice = maleVoice;
    } else { // lady
      utterance.pitch = 1.15;  // Slightly elevated pitch for lady
      utterance.rate = 1.0;    // Normal rate for lady voice
      // Try to find a female voice
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

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const startTour = () => { setTourActive(true); setCurrentStep(1); };
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

export const useMsaidizi = () => {
  const context = useContext(MsaidiziContext);
  if (!context) throw new Error('useMsaidizi must be used within MsaidiziProvider');
  return context;
};
