import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  Home,
  Languages,
  Lock,
  MessageSquare,
  Moon,
  Send,
  Settings,
  Shield,
  SunMedium,
  Users,
} from 'lucide-react';
import { askRafikiAI, createAlert } from '@/lib/api';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';

type TabId = 'home' | 'messages' | 'settings';
type PillarId = 'rafiki' | 'jirani' | 'mlinzi';
type MlinziFeature = 'menu' | 'heatmap' | 'scanner';

type ChatMessage = {
  from: 'user' | 'ai';
  text: string;
};

type HeatCell = {
  id: string;
  label: string;
  risk: 'Low' | 'Medium' | 'High';
  recommendation: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
};

type ShortcutCard = {
  id: PillarId;
  module: string;
  title: string;
  subtitle: string;
  icon: typeof Bot;
  classes: string;
  titleClass: string;
  subtitleClass: string;
  tagClass: string;
  chevronClass: string;
};

const heatCells: HeatCell[] = [
  {
    id: 'gatanga-north',
    label: 'Gatanga North',
    risk: 'High',
    recommendation: 'Deploy vaccine X and scale up CHV follow-up over the next 48 hours.',
    lat: -0.718,
    lng: 37.03,
    x: 30,
    y: 26,
  },
  {
    id: 'gatanga-south',
    label: 'Gatanga South',
    risk: 'Medium',
    recommendation: 'Increase outreach and caregiver reminders this week.',
    lat: -0.775,
    lng: 37.05,
    x: 35,
    y: 44,
  },
  {
    id: 'kandara',
    label: 'Kandara',
    risk: 'High',
    recommendation: 'Activate mobile vaccination teams and allocate emergency stock.',
    lat: -0.91,
    lng: 37.04,
    x: 42,
    y: 60,
  },
  {
    id: 'kiharu',
    label: 'Kiharu',
    risk: 'Low',
    recommendation: 'Maintain routine surveillance and weekly reporting.',
    lat: -0.74,
    lng: 37.16,
    x: 56,
    y: 32,
  },
  {
    id: 'maragua',
    label: 'Maragua',
    risk: 'High',
    recommendation: 'Initiate rapid response review and targeted field visits.',
    lat: -0.79,
    lng: 37.12,
    x: 60,
    y: 50,
  },
  {
    id: 'kangema',
    label: 'Kangema',
    risk: 'Low',
    recommendation: 'Continue current clinic schedule and routine check-ins.',
    lat: -0.69,
    lng: 36.99,
    x: 67,
    y: 22,
  },
  {
    id: 'mathioya',
    label: 'Mathioya',
    risk: 'Medium',
    recommendation: 'Run awareness campaign on early symptom reporting.',
    lat: -0.73,
    lng: 37.0,
    x: 73,
    y: 37,
  },
  {
    id: 'muranga-town',
    label: "Murang'a Town",
    risk: 'High',
    recommendation: 'Scale up market-day vaccination and bus-stage screening.',
    lat: -0.721,
    lng: 37.152,
    x: 54,
    y: 72,
  },
];

const sampleContacts = [
  { name: 'Wanjiku N.', role: 'CHV', distance: '0.8 km', status: 'Available' },
  { name: 'Kariuki C.', role: 'Responder', distance: '1.3 km', status: 'On-call' },
  { name: 'Njeri M.', role: 'Nurse', distance: '2.1 km', status: 'Available' },
  { name: 'Karanja P.', role: 'CHP', distance: '3.0 km', status: 'Busy' },
];

const patientMessages = [
  {
    title: 'Patient Notification',
    body: 'Hi Amina, your vitals are stable today. Keep hydration up and check in again this evening.',
    at: '09:20',
  },
];

const Index = () => {
  const { language, setLanguage, theme, setTheme, setActiveRole, setActiveView, speak, tourActive, currentStep, totalSteps, setTotalSteps, nextStep, startTour, endTour } = useMsaidizi();

  const [tab, setTab] = useState<TabId>('home');
  const [pillar, setPillar] = useState<PillarId | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [rafikiThinking, setRafikiThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      from: 'ai',
      text:
        language === 'sw'
          ? 'Habari 👋 Mimi ni Rafiki. Niambie dalili zako au swali la afya.'
          : 'Hi 👋 I am Rafiki. Tell me your symptoms or any health question.',
    },
  ]);
  const [hoveredHeatCell, setHoveredHeatCell] = useState<HeatCell | null>(null);
  const [selectedHeatCell, setSelectedHeatCell] = useState<HeatCell | null>(heatCells[0]);
  const [mlinziFeature, setMlinziFeature] = useState<MlinziFeature>('menu');
  const [emergencyState, setEmergencyState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isDark, setIsDark] = useState(theme === 'dark');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const tourTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    setActiveRole('patient-demo');
  }, [setActiveRole]);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      console.log('[Boot] Starting tour - tourSteps.length:', tourSteps.length);
      setTab('home');
      setPillar(null);
      setTotalSteps(tourSteps.length);
      startTour();
    }, 100);

    return () => window.clearTimeout(boot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'home' && pillar) {
      setActiveView(pillar);
      return;
    }
    setActiveView(tab);
  }, [tab, pillar, setActiveView]);

  useEffect(() => {
    const updateIsDark = () => {
      setIsDark(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    };

    updateIsDark();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', updateIsDark);
      return () => mq.removeEventListener('change', updateIsDark);
    }

    return undefined;
  }, [theme]);

  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length !== 1 || prev[0].from !== 'ai') return prev;
      return [
        {
          from: 'ai',
          text:
            language === 'sw'
              ? 'Habari 👋 Mimi ni Rafiki. Niambie dalili zako au swali la afya.'
              : 'Hi 👋 I am Rafiki. Tell me your symptoms or any health question.',
        },
      ];
    });
  }, [language]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, rafikiThinking]);

  const mobileShortcutCards = useMemo<ShortcutCard[]>(() => {
    const rafikiIsDark = isDark;
    return [
      {
        id: 'rafiki',
        module: 'RAFIKI',
        title: 'ASK\nRAFIKI',
        subtitle: language === 'sw' ? 'Zungumza na msaidizi wako wa afya wa AI kwa msaada wa haraka.' : 'Chat with your AI companion for fast guidance.',
        icon: Bot,
        classes: rafikiIsDark ? 'from-white via-white to-[#f5f5f7]' : 'from-[#3a3a3f] via-[#212126] to-[#0b0b0f]',
        titleClass: rafikiIsDark ? 'text-[#111827]' : 'text-white',
        subtitleClass: rafikiIsDark ? 'text-slate-700' : 'text-white',
        tagClass: rafikiIsDark ? 'border-black/10 bg-black/5 text-[#111827]' : 'border-white/25 bg-black/10 text-white',
        chevronClass: rafikiIsDark ? 'text-[#4b5563]' : 'text-white',
      },
      {
        id: 'jirani',
        module: 'JIRANI',
        title: 'JIRANI\nNETWORK',
        subtitle: language === 'sw' ? 'Tazama majirani, wahudumu wa jamii na waokoaji wanaokuuzunguka.' : 'See trusted neighbours, CHVs and responders around you.',
        icon: Users,
        classes: 'from-[#4aa8d7] via-[#2f89bf] to-[#216a9b]',
        titleClass: 'text-white',
        subtitleClass: 'text-white/92',
        tagClass: 'border-white/25 bg-black/10 text-white/90',
        chevronClass: 'text-white/90',
      },
      {
        id: 'mlinzi',
        module: 'MLINZI',
        title: 'MLINZI\nVITALS',
        subtitle: language === 'sw' ? 'Hifadhi vipimo vyako na fuatilia hatari kwa urahisi.' : 'Capture your vitals and keep an eye on risk.',
        icon: Shield,
        classes: 'from-[#e9a331] via-[#c87712] to-[#a85d08]',
        titleClass: 'text-white',
        subtitleClass: 'text-white/92',
        tagClass: 'border-white/25 bg-black/10 text-white/90',
        chevronClass: 'text-white/90',
      },
    ];
  }, [isDark, language]);

  const tourSteps = useMemo(
    () => [
      {
        target: 'header',
        en: 'Welcome to Dawa Mashinani. This is your platform header showing the system status.',
        sw: 'Karibu kwenye Dawa Mashinani. Hii ni sehemu ya juu ya jukwaa inayoonyesha hali ya mfumo.',
        ms: 8200,
      },
      {
        target: 'home-cards',
        en: 'Below you will find the three core pillars of the platform.',
        sw: 'Hapa chini utapata nguzo tatu muhimu za jukwaa.',
        ms: 7600,
      },
      {
        target: 'home-rafiki',
        en: 'Rafiki is your AI health companion. Ask questions about symptoms, medicines, and health guidance.',
        sw: 'Rafiki ni msaidizi wako wa afya wa AI. Uliza maswali kuhusu dalili, dawa, na mwongozo wa afya.',
        ms: 8500,
      },
      {
        target: 'home-jirani',
        en: 'Jirani connects you with trusted community health workers and emergency responders nearby.',
        sw: 'Jirani inakuunganisha na wahudumu wa afya wa jamii na waokoaji wa dharura wanaokuuzunguka.',
        ms: 8500,
      },
      {
        target: 'home-mlinzi',
        en: 'Mlinzi lets you track vital signs with a heatmap view and an upcoming vitals scanner tool.',
        sw: 'Mlinzi inakuruhusu kufuatilia ishara muhimu na kuona ramani ya hatari iliyokuja.',
        ms: 8500,
      },
      {
        target: 'nav-home',
        en: 'This is your Home button. Use it to return to the main dashboard anytime.',
        sw: 'Hii ni kitufe cha Home. Inatumia kurudi kwenye dashibodi kuu wakati wowote.',
        ms: 7800,
      },
      {
        target: 'nav-messages',
        en: 'Messages shows all patient notifications, reminders, and updates from the platform.',
        sw: 'Messages inaonyesha taarifa zote za mgonjwa, vikumbusho, na sasisho kutoka jukwaa.',
        ms: 8200,
      },
      {
        target: 'nav-settings',
        en: 'Settings lets you change your language between English and Swahili, and adjust the theme.',
        sw: 'Settings inakuruhusu kubadili lugha kati ya Kiingereza na Kiswahili, na kubadili mandhari.',
        ms: 8500,
      },
      {
        target: 'tour-end',
        en: 'Great! You are now ready to explore Dawa Mashinani. Start by asking Rafiki a health question.',
        sw: 'Nzuri! Sasa uko tayari kuchimba Dawa Mashinani. Anza kwa kuuliza Rafiki swali la afya.',
        ms: 9000,
      },
    ],
    []
  );

  const tourStep = tourSteps[currentStep - 1] ?? null;

  const isTourTarget = (target: string) => tourActive && tourStep?.target === target;

  useEffect(() => {
    if (!tourActive || currentStep < 1 || !tourStep) {
      console.log('[Tour] Skipped - tourActive:', tourActive, 'currentStep:', currentStep, 'tourStep:', tourStep?.target);
      return;
    }

    console.log('[Tour] Progressing to step', currentStep, 'target:', tourStep.target);

    // Clear any existing timer
    if (tourTimerRef.current) {
      window.clearTimeout(tourTimerRef.current);
    }

    // Scroll to target element
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${tourStep.target}"]`);
      if (el) {
        console.log('[Tour] Scrolling to', tourStep.target);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.warn('[Tour] Element not found:', tourStep.target);
      }
    }, 50);

    // Speak the tour step
    const speakDuration = Math.max(tourStep.ms - 1000, 1000);
    console.log('[Tour] Speaking:', tourStep.en, 'duration:', speakDuration);
    speak(tourStep.en, tourStep.sw, speakDuration);

    // Auto-progress to next step
    tourTimerRef.current = window.setTimeout(() => {
      console.log('[Tour] Timer fired for step', currentStep, '- will', currentStep >= tourSteps.length ? 'endTour' : 'nextStep');
      if (currentStep >= tourSteps.length) {
        endTour();
      } else {
        nextStep();
      }
    }, tourStep.ms);

    return () => {
      if (tourTimerRef.current) window.clearTimeout(tourTimerRef.current);
    };
  }, [tourActive, currentStep, tourStep, tourSteps.length, speak, nextStep, endTour]);

  const shouldShowPillarHome = tab === 'home' && !pillar;
  const shouldShowPillarDetail = tab === 'home' && !!pillar;
  const activeHeatCell = hoveredHeatCell || selectedHeatCell || heatCells[0];

  const openPillar = (target: PillarId) => {
    setTab('home');
    setPillar(target);
    if (target === 'mlinzi') setMlinziFeature('menu');
  };

  const sendRafiki = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || rafikiThinking) return;
    const history = [...chatMessages, { from: 'user', text: trimmed } as ChatMessage];
    const languageInstruction =
      language === 'sw'
        ? 'Jibu kwa Kiswahili pekee. Usichanganye na Kiingereza.'
        : 'Reply in English only. Do not mix with Swahili.';
    setChatMessages(history);
    setChatInput('');
    setRafikiThinking(true);
    try {
      const res = await askRafikiAI(`${trimmed}\n\n${languageInstruction}`, history);
      setChatMessages((prev) => [...prev, { from: 'ai', text: res.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { from: 'ai', text: language === 'sw' ? 'Samahani, jaribu tena.' : 'Sorry, please try again.' }]);
    } finally {
      setRafikiThinking(false);
    }
  };

  const triggerEmergency = async () => {
    setEmergencyState('sending');
    try {
      await createAlert({
        patient_name: 'Amina Wanjiku',
        phone: '+254712345678',
        symptom: 'Manual demo emergency alert',
        severity: 'high',
        location: "Murang'a Ward",
        source: 'Demo',
        alert_type: 'emergency',
      });
      setEmergencyState('sent');
      window.setTimeout(() => setEmergencyState('idle'), 3000);
    } catch (error) {
      console.warn('[Jirani] Alert API failed, using demo success fallback.', error);
      setEmergencyState('sent');
      window.setTimeout(() => setEmergencyState('idle'), 3000);
    }
  };

  return (
    <div className={`min-h-[100dvh] ${isDark ? 'bg-[#0d1117] text-slate-100' : 'bg-[#f6f5ef] text-[#1f140c]'} flex flex-col`}>
      <header data-tour="header" className={`px-4 pt-3 pb-1 ${isTourTarget('header') ? 'rounded-3xl ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-[#f6f5ef]' : ''}`}>
        <div className="mx-auto w-full max-w-4xl rounded-[24px] border border-[#d9e4d2] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(31,20,12,0.08)] lg:w-3/4">
          <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4 sm:grid-cols-[64px_1fr_auto]">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#d2ddcc] bg-[#f0f7ef] shadow-inner">
              <img src="/Dawa-Mashinani-favicon.svg" alt="Dawa Mashinani profile" className="h-full w-full object-cover" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.6em] text-[#0c4c31]">DAWA</p>
              <p className="-mt-1 text-base font-black tracking-[0.52em] text-[#163726]">MASHINANI</p>
            </div>
            <div className="rounded-full border border-[#8bc196] bg-[#e8f6ea] px-4 py-1 text-[11px] font-semibold text-[#2f7f43] shadow-sm">Online</div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 pb-24 md:px-8 md:pb-4">
        {shouldShowPillarHome && (
          <div data-tour="home-cards" className={`mx-auto w-full max-w-4xl space-y-3 pt-4 pb-2 lg:w-3/4 ${isTourTarget('home-cards') ? 'rounded-3xl ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-[#f6f5ef]' : ''}`}>
            <section className="flex min-h-[calc(100dvh-290px)] flex-col justify-evenly gap-5 sm:min-h-0 sm:block sm:space-y-4">
              {mobileShortcutCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    data-tour={`home-${card.id}`}
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.35 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openPillar(card.id)}
                    className={`relative w-full overflow-hidden rounded-[24px] border border-white/35 bg-gradient-to-r ${card.classes} px-4 py-3 sm:py-2 text-left shadow-[0_16px_36px_rgba(25,30,22,0.16)] ${isTourTarget(`home-${card.id}`) ? 'ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-transparent z-10' : ''}`}
                  >
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/30 bg-white/15 shadow-inner backdrop-blur-sm">
                        <Icon className="h-10 w-10" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`whitespace-pre-line text-xl font-black uppercase leading-[0.9] tracking-tight ${card.titleClass}`}>{card.title}</p>
                        <p className={`mt-2 max-w-[22rem] text-xs leading-snug sm:text-sm ${card.subtitleClass}`}>{card.subtitle}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.22em] ${card.tagClass}`}>{card.module}</span>
                          <ChevronRight className={`h-4 w-4 ${card.chevronClass}`} />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </section>
          </div>
        )}

        {shouldShowPillarDetail && (
          <div className="mx-auto w-full max-w-4xl space-y-6 pt-4 lg:w-3/4">
            <button onClick={() => setPillar(null)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a25125]"><ArrowLeft className="w-3.5 h-3.5" />{language === 'sw' ? 'Rudi main' : 'Back to main'}</button>

            {pillar === 'rafiki' && (
              <div className="rounded-[32px] border border-[#e9d3c0] bg-white/95 p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a6f4b]">Rafiki AI consultation</p>
                <div ref={chatScrollRef} className="mt-3 space-y-2 max-h-[46dvh] overflow-y-auto pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div key={`${msg.from}-${idx}`} className={`rounded-3xl px-4 py-2.5 text-sm border ${msg.from === 'user' ? 'bg-[#fbeee0] border-[#f0d4ba] ml-10' : 'bg-[#f7fff7] border-[#d9f1de] mr-10'}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-3xl border border-[#e9d3c0] bg-white/90 p-2 flex items-center gap-2">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendRafiki()} className="flex-1 bg-transparent outline-none text-sm px-1 text-[#2b1b12]" placeholder={language === 'sw' ? 'Andika swali lako la afya...' : 'Type your health question...'} />
                  <button onClick={sendRafiki} disabled={rafikiThinking} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0f2c22] text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
                </div>
              </div>
            )}

            {pillar === 'jirani' && (
              <div id="tour-jirani-alert" className={`grid gap-5 lg:grid-cols-[1.1fr_0.9fr] ${isTourTarget('jirani-alert') ? 'rounded-3xl ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-[#f6f5ef]' : ''}`}>
                <div className="rounded-[32px] border border-[#cde5f6] bg-white/95 p-5 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#3e7aa0]">Jirani Network</p>
                  <div className="mt-3 space-y-3">
                    {sampleContacts.map((contact) => (
                      <div key={contact.name} className="rounded-2xl border border-[#d8ebf8] bg-[#f6fbff] px-3 py-2">
                        <p className="text-sm font-semibold text-[#1f4362]">{contact.name}</p>
                        <p className="text-xs text-[#486b88]">{contact.role} · {contact.distance} · {contact.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[32px] border border-[#f0d4ba] bg-gradient-to-br from-white to-[#fff2e7] p-5 shadow-sm">
                  <p className="text-sm font-semibold text-[#6f3a18]">{language === 'sw' ? 'Dharura ya Haraka' : 'Emergency Trigger'}</p>
                  <button onClick={triggerEmergency} disabled={emergencyState === 'sending'} className="mt-4 w-full rounded-2xl bg-[#c85624] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {emergencyState === 'sending' && (language === 'sw' ? 'Inatuma...' : 'Sending...')}
                    {emergencyState === 'sent' && (language === 'sw' ? 'Imetumwa ✓' : 'Sent ✓')}
                    {emergencyState === 'error' && (language === 'sw' ? 'Imeshindikana' : 'Failed')}
                    {emergencyState === 'idle' && (language === 'sw' ? 'Tuma tahadhari ya dharura' : 'Send emergency alert')}
                  </button>
                </div>
              </div>
            )}

            {pillar === 'mlinzi' && (
              <div className="rounded-[32px] border border-[#e6e1c9] bg-white/95 p-5 shadow-sm space-y-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d6f2a]">Mlinzi</p>

                {(mlinziFeature === 'menu' || mlinziFeature === 'scanner') && (
                  <div id="tour-mlinzi-menu" className={`grid grid-cols-2 gap-3 ${isTourTarget('mlinzi-menu') ? 'rounded-3xl ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-[#f6f5ef] p-2' : ''}`}>
                    <button
                      onClick={() => setMlinziFeature('heatmap')}
                      className="rounded-2xl border border-[#e7dec0] bg-gradient-to-br from-[#fffdf5] to-[#f7f0d7] px-4 py-5 text-left shadow-sm"
                    >
                      <p className="text-xs font-bold tracking-[0.2em] text-[#6e6123]">MLINZI HEATMAP</p>
                      <p className="mt-2 text-xs text-[#6b6140]">{language === 'sw' ? 'Fungua ramani ya hatari.' : 'Open hotspot risk map.'}</p>
                    </button>

                    <button
                      onClick={() => setMlinziFeature('scanner')}
                      className="rounded-2xl border border-dashed border-[#d2d6dc] bg-gradient-to-br from-[#f7f7f8] to-[#eceef1] px-4 py-5 text-left shadow-sm"
                    >
                      <div className="inline-flex items-center gap-1 rounded-full border border-[#c5cad3] bg-white px-2 py-0.5 text-[10px] font-bold text-[#4b5563]">
                        <Lock className="h-3 w-3" />
                        COMING SOON
                      </div>
                      <p className="mt-2 text-xs font-bold tracking-[0.2em] text-[#48505e]">VITALS SCANNER</p>
                      <p className="mt-2 text-xs text-[#677183]">{language === 'sw' ? 'Hii itapatikana hivi karibuni.' : 'This feature will be available soon.'}</p>
                    </button>
                  </div>
                )}

                {mlinziFeature === 'scanner' && (
                  <div className="rounded-2xl border border-dashed border-[#d2d6dc] bg-[#f8fafc] px-4 py-3 text-sm text-[#556274]">
                    {language === 'sw' ? 'Vitals Scanner imefungwa kwa sasa — Coming Soon.' : 'Vitals Scanner is locked for now — Coming Soon.'}
                  </div>
                )}

                {mlinziFeature === 'heatmap' && (
                  <div id="tour-mlinzi-heatmap" className={`${isTourTarget('mlinzi-heatmap') ? 'rounded-3xl ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-[#f6f5ef] p-2' : ''}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[#7d6f2a]">Mlinzi Heatmap</p>
                      <button onClick={() => setMlinziFeature('menu')} className="text-xs font-semibold text-[#946e1e]">{language === 'sw' ? 'Rudi tools' : 'Back to tools'}</button>
                    </div>
                    <div className="overflow-hidden rounded-3xl border border-white/60 bg-[#f7faf5] shadow-inner">
                      <div className="relative h-[360px] w-full">
                        <iframe
                          title="Murang'a Risk Map"
                          className="h-full w-full"
                          loading="lazy"
                          src="https://www.openstreetmap.org/export/embed.html?bbox=36.88%2C-0.98%2C37.28%2C-0.60&layer=mapnik"
                        />

                        {heatCells.map((cell) => {
                          const color = cell.risk === 'High' ? '#e5383b' : cell.risk === 'Medium' ? '#f59e0b' : '#22c55e';
                          const size = cell.risk === 'High' ? 26 : cell.risk === 'Medium' ? 22 : 18;
                          return (
                            <button
                              key={cell.id}
                              type="button"
                              title={`${cell.label}: ${cell.risk} risk`}
                              onMouseEnter={() => setHoveredHeatCell(cell)}
                              onMouseLeave={() => setHoveredHeatCell(null)}
                              onClick={() => setSelectedHeatCell(cell)}
                              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-[0_0_0_6px_rgba(255,255,255,0.25)]"
                              style={{
                                left: `${cell.x}%`,
                                top: `${cell.y}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                backgroundColor: color,
                                boxShadow: `0 0 24px ${color}`,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="border-t border-[#dde8df] bg-white/90 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#1f3a2f]">Low</span>
                          <div className="h-2 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #e5383b 100%)' }} />
                          <span className="text-[10px] font-semibold text-[#1f3a2f]">High</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-[#1f3a2f]">{activeHeatCell.label} · {activeHeatCell.risk} risk</p>
                        <p className="mt-1 text-[11px] text-[#486454]">{activeHeatCell.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div id="tour-messages-panel" className={`mx-auto w-full max-w-4xl space-y-3 pt-4 pb-2 lg:w-3/4 ${isTourTarget('messages-panel') ? 'rounded-3xl ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-[#f6f5ef] p-2' : ''}`}>
            {patientMessages.map((msg) => (
              <div key={msg.title} className="rounded-2xl border border-[#d8eadc] bg-white/95 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1f4a31]">{msg.title}</p>
                  <p className="text-[11px] text-[#6b7f71]">{msg.at}</p>
                </div>
                <p className="mt-1 text-xs text-[#5f6f63]">{msg.body}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div id="tour-settings-panel" className={`mx-auto w-full max-w-4xl space-y-3 pt-4 pb-2 lg:w-3/4 ${isTourTarget('settings-panel') ? 'rounded-3xl ring-4 ring-[#f59e0b] ring-offset-2 ring-offset-[#f6f5ef] p-2' : ''}`}>
            <div className="rounded-[28px] border border-[#d4e3d8] bg-white/95 backdrop-blur-sm p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-[#dce8de] px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#244431]"><Languages className="h-4 w-4" />{language === 'sw' ? 'Lugha' : 'Language'}</div>
                <button onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')} className="rounded-full border border-[#cfe4d6] px-3 py-1 text-xs font-semibold bg-[#f2fbf6]">{language === 'en' ? 'EN' : 'SW'}</button>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#dce8de] px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#244431]">{theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}{language === 'sw' ? 'Mandhari' : 'Theme'}</div>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full border border-[#cfe4d6] px-3 py-1 text-xs font-semibold bg-[#f2fbf6]">{theme === 'dark' ? 'Dark' : 'Light'}</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="sticky bottom-0 z-20 px-3 pb-3 pt-2 md:hidden">
        <div className="mx-auto max-w-md rounded-[24px] border border-[#dfe7da] bg-white px-3 py-2 shadow-[0_16px_40px_rgba(19,30,22,0.14)]">
          <div className="grid grid-cols-3 gap-1">
            <button data-tour="nav-home" onClick={() => { setTab('home'); setPillar(null); }} className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${tab === 'home' ? 'text-[#40914a]' : 'text-[#8c857d]'} ${isTourTarget('nav-home') ? 'ring-4 ring-[#f59e0b]' : ''}`}><Home className="h-4 w-4" />Home</button>
            <button data-tour="nav-messages" onClick={() => { setTab('messages'); setPillar(null); }} className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${tab === 'messages' ? 'text-[#40914a]' : 'text-[#8c857d]'} ${isTourTarget('nav-messages') ? 'ring-4 ring-[#f59e0b]' : ''}`}><MessageSquare className="h-4 w-4" />Messages</button>
            <button data-tour="nav-settings" onClick={() => { setTab('settings'); setPillar(null); }} className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${tab === 'settings' ? 'text-[#40914a]' : 'text-[#8c857d]'} ${isTourTarget('nav-settings') ? 'ring-4 ring-[#f59e0b]' : ''}`}><Settings className="h-4 w-4" />Settings</button>
          </div>
        </div>
      </nav>

      <nav className="hidden sticky bottom-4 px-4 md:px-0 md:block">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#e9d3c0] bg-white/90 backdrop-blur-lg shadow-[0_30px_80px_rgba(31,20,12,0.18)] px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              data-tour="nav-home"
              onClick={() => {
                setTab('home');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'home' ? 'bg-[#0f2c22] text-white' : 'text-[#7a5c47]'
              } ${isTourTarget('nav-home') ? 'ring-4 ring-[#f59e0b]' : ''}`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              data-tour="nav-messages"
              onClick={() => {
                setTab('messages');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'messages' ? 'bg-[#c85624] text-white' : 'text-[#7a5c47]'
              } ${isTourTarget('nav-messages') ? 'ring-4 ring-[#f59e0b]' : ''}`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </button>
            <button
              data-tour="nav-settings"
              onClick={() => {
                setTab('settings');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'settings' ? 'bg-[#f2eadd] text-[#1f140c]' : 'text-[#7a5c47]'
              } ${isTourTarget('nav-settings') ? 'ring-4 ring-[#f59e0b]' : ''}`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;

/*
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  Home,
  Languages,
  MessageSquare,
  Moon,
  Send,
  Settings,
  Shield,
  SunMedium,
  Users,
} from 'lucide-react';
import { askRafikiAI, createAlert } from '@/lib/api';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';

type TabId = 'home' | 'messages' | 'settings';
type PillarId = 'rafiki' | 'jirani' | 'mlinzi';

type ChatMessage = {
  from: 'user' | 'ai';
  text: string;
};

type HeatCell = {
  id: string;
  label: string;
  risk: 'Low' | 'Medium' | 'High';
  recommendation: string;
  lat: number;
  lng: number;
};

type ShortcutCard = {
  id: PillarId;
  module: string;
  title: string;
  subtitle: string;
  icon: typeof Bot;
  classes: string;
  titleClass: string;
  subtitleClass: string;
  tagClass: string;
  chevronClass: string;
};

const heatCells: HeatCell[] = [
  {
    id: 'gatanga-north',
    label: 'Gatanga North',
    risk: 'High',
    recommendation: 'Deploy vaccine X and scale up CHV follow-up over the next 48 hours.',
    lat: -0.718,
    lng: 37.03,
  },
  {
    id: 'gatanga-south',
    label: 'Gatanga South',
    risk: 'Medium',
    recommendation: 'Increase outreach and caregiver reminders this week.',
    lat: -0.775,
    lng: 37.05,
  },
  {
    id: 'kandara',
    label: 'Kandara',
    risk: 'High',
    recommendation: 'Activate mobile vaccination teams and allocate emergency stock.',
    lat: -0.91,
    lng: 37.04,
  },
  {
    id: 'kiharu',
    label: 'Kiharu',
    risk: 'Low',
    recommendation: 'Maintain routine surveillance and weekly reporting.',
    lat: -0.74,
    lng: 37.16,
  },
  {
    id: 'maragua',
    label: 'Maragua',
    risk: 'High',
    recommendation: 'Initiate rapid response review and targeted field visits.',
    lat: -0.79,
    lng: 37.12,
  },
  {
    id: 'kangema',
    label: 'Kangema',
    risk: 'Low',
    recommendation: 'Continue current clinic schedule and routine check-ins.',
    lat: -0.69,
    lng: 36.99,
  },
  {
    id: 'mathioya',
    label: 'Mathioya',
    risk: 'Medium',
    recommendation: 'Run awareness campaign on early symptom reporting.',
    lat: -0.73,
    lng: 37,
  },
  {
    id: 'muranga-town',
    label: "Murang'a Town",
    risk: 'High',
    recommendation: 'Scale up market-day vaccination and bus-stage screening.',
    lat: -0.721,
    lng: 37.152,
  },
];

const sampleContacts = [
  { name: 'Wanjiku N.', role: 'CHV', distance: '0.8 km', status: 'Available' },
  { name: 'Kariuki C.', role: 'Responder', distance: '1.3 km', status: 'On-call' },
  { name: 'Njeri M.', role: 'Nurse', distance: '2.1 km', status: 'Available' },
  { name: 'Karanja P.', role: 'CHP', distance: '3.0 km', status: 'Busy' },
];

const sampleMessages = [
  {
    title: 'Patient Notification',
    body: 'Hi Amina, your vitals are stable today. Keep hydration up and check in again this evening.',
    at: '09:20',
  },
];

const Index = () => {
  const { language, setLanguage, theme, setTheme, setActiveRole, setActiveView } = useMsaidizi();

  const [tab, setTab] = useState<TabId>('home');
  const [pillar, setPillar] = useState<PillarId | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [rafikiThinking, setRafikiThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      from: 'ai',
      text:
        language === 'sw'
                <div className="mt-3 overflow-hidden rounded-3xl border border-white/60 bg-[#f7faf5] shadow-inner">
                  <div className="h-[360px] w-full">
                    <MapContainer
                      center={[-0.76, 37.08]}
                      zoom={10}
                      scrollWheelZoom
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {heatCells.map((cell) => {
                        const color = cell.risk === 'High' ? '#e5383b' : cell.risk === 'Medium' ? '#f59e0b' : '#22c55e';
                        const radius = cell.risk === 'High' ? 24 : cell.risk === 'Medium' ? 18 : 14;

                        return (
                          <CircleMarker
                            key={cell.id}
                            center={[cell.lat, cell.lng]}
                            radius={radius}
                            pathOptions={{
                              color,
                              weight: 2,
                              fillColor: color,
                              fillOpacity: 0.35,
                            }}
                            eventHandlers={{
                              mouseover: () => setHoveredHeatCell(cell),
                              mouseout: () => setHoveredHeatCell(null),
                              click: () => setSelectedHeatCell(cell),
                            }}
                          >
                            <Popup>
                              <div className="text-xs">
                                <p className="font-semibold">{cell.label}</p>
                                <p>{cell.risk} risk</p>
                                <p className="mt-1">{cell.recommendation}</p>
                              </div>
                            </Popup>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  </div>

                  <div className="border-t border-[#dde8df] bg-white/90 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-[#1f3a2f]">Low</span>
                      <div
                        className="h-2 flex-1 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #e5383b 100%)',
                        }}
                      />
                      <span className="text-[10px] font-semibold text-[#1f3a2f]">High</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#1f3a2f]">
                      {activeHeatCell.label} · {activeHeatCell.risk} risk
                    </p>
                    <p className="mt-1 text-[11px] text-[#486454]">{activeHeatCell.recommendation}</p>
    const rafikiIsDark = isDark;
    const rafikiSubtitleEn = 'Chat with your AI companion for fast guidance.';
    const rafikiSubtitleSw = 'Zungumza na msaidizi wako wa afya wa AI kwa msaada wa haraka.';
    const jiraniSubtitleEn = 'See trusted neighbours, CHVs and responders around you.';
    const jiraniSubtitleSw = 'Tazama majirani, wahudumu wa jamii na waokoaji wanaokuuzunguka.';
    const mlinziSubtitleEn = 'Capture your vitals and keep an eye on risk.';
    const mlinziSubtitleSw = 'Hifadhi vipimo vyako na fuatilia hatari kwa urahisi.';

    return [
      {
        id: 'rafiki',
        module: 'RAFIKI',
        title: 'ASK\nRAFIKI',
        subtitle: language === 'sw' ? rafikiSubtitleSw : rafikiSubtitleEn,
        icon: Bot,
        classes: rafikiIsDark
          ? 'from-white via-white to-[#f5f5f7]'
          : 'from-[#3a3a3f] via-[#212126] to-[#0b0b0f]',
        titleClass: rafikiIsDark ? 'text-[#111827]' : 'text-white',
        subtitleClass: rafikiIsDark ? 'text-slate-700' : 'text-white',
        tagClass: rafikiIsDark
          ? 'border-black/10 bg-black/5 text-[#111827]'
          : 'border-white/25 bg-black/10 text-white',
        chevronClass: rafikiIsDark ? 'text-[#4b5563]' : 'text-white',
      },
      {
        id: 'jirani',
        module: 'JIRANI',
        title: 'JIRANI\nNETWORK',
        subtitle: language === 'sw' ? jiraniSubtitleSw : jiraniSubtitleEn,
        icon: Users,
        classes: 'from-[#4aa8d7] via-[#2f89bf] to-[#216a9b]',
        titleClass: 'text-white',
        subtitleClass: 'text-white/92',
        tagClass: 'border-white/25 bg-black/10 text-white/90',
        chevronClass: 'text-white/90',
      },
      {
        id: 'mlinzi',
        module: 'MLINZI',
        title: 'MLINZI\nVITALS',
        subtitle: language === 'sw' ? mlinziSubtitleSw : mlinziSubtitleEn,
        icon: Shield,
        classes: 'from-[#e9a331] via-[#c87712] to-[#a85d08]',
        titleClass: 'text-white',
        subtitleClass: 'text-white/92',
        tagClass: 'border-white/25 bg-black/10 text-white/90',
        chevronClass: 'text-white/90',
      },
    ];
  }, [isDark, language]);

  const shouldShowPillarHome = tab === 'home' && !pillar;
  const shouldShowPillarDetail = tab === 'home' && !!pillar;
  const activeHeatCell = hoveredHeatCell || selectedHeatCell || heatCells[0];

  const sendRafiki = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || rafikiThinking) return;

    const userMessage: ChatMessage = { from: 'user', text: trimmed };
    const history = [...chatMessages, userMessage];
    setChatMessages(history);
    setChatInput('');
    setRafikiThinking(true);

    try {
      const res = await askRafikiAI(trimmed, history);
      setChatMessages((prev) => [...prev, { from: 'ai', text: res.reply }]);
    } catch (error) {
      console.error('[Rafiki] Failed to reply', error);
      setChatMessages((prev) => [
        ...prev,
        {
          from: 'ai',
          text:
            language === 'sw'
              ? 'Samahani, kuna hitilafu ya mtandao. Tafadhali jaribu tena.'
              : 'Sorry, there was a network issue. Please try again.',
        },
      ]);
    } finally {
      setRafikiThinking(false);
    }
  };

  const triggerEmergency = async () => {
    setEmergencyState('sending');
    try {
      await createAlert({
        patient_name: 'Amina Wanjiku',
        phone: '+254712345678',
        symptom: 'Manual demo emergency alert',
        severity: 'high',
        location: "Murang'a Ward",
        source: 'Demo',
        alert_type: 'emergency',
      });
      setEmergencyState('sent');
      window.setTimeout(() => setEmergencyState('idle'), 3000);
    } catch (error) {
      console.error('[Jirani] Emergency alert failed', error);
      setEmergencyState('error');
      window.setTimeout(() => setEmergencyState('idle'), 3000);
    }
  };

  const openPillar = (target: PillarId) => {
    setTab('home');
    setPillar(target);
  };

  return (
    <div className={`min-h-[100dvh] ${isDark ? 'bg-[#0d1117] text-slate-100' : 'bg-[#f6f5ef] text-[#1f140c]'} flex flex-col`}>
      <header className="px-4 pt-3 pb-1">
        <div className="mx-auto w-full max-w-4xl rounded-[24px] border border-[#d9e4d2] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(31,20,12,0.08)] lg:w-3/4">
          <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4 sm:grid-cols-[64px_1fr_auto]">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#d2ddcc] bg-[#f0f7ef] shadow-inner">
              <img src="/Dawa-Mashinani-favicon.svg" alt="Dawa Mashinani profile" className="h-9 w-9 object-contain" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.6em] text-[#0c4c31]">DAWA</p>
              <p className="-mt-1 text-base font-black tracking-[0.52em] text-[#163726]">MASHINANI</p>
            </div>
            <div className="rounded-full border border-[#8bc196] bg-[#e8f6ea] px-4 py-1 text-[11px] font-semibold text-[#2f7f43] shadow-sm">
              Online
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 pb-24 md:px-8 md:pb-4">
        {shouldShowPillarHome && (
          <div className="mx-auto w-full max-w-4xl space-y-3 pt-4 pb-2 lg:w-3/4">
            <section className="space-y-4">
              {mobileShortcutCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.35 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openPillar(card.id)}
                    className={`relative w-full overflow-hidden rounded-[24px] border border-white/35 bg-gradient-to-r ${card.classes} px-4 py-2 text-left shadow-[0_16px_36px_rgba(25,30,22,0.16)]`}
                  >
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, rgba(255,255,255,0.14) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.14) 75%, transparent 75%, transparent)',
                        backgroundSize: '18px 18px',
                      }}
                    />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/30 bg-white/15 shadow-inner backdrop-blur-sm">
                        <Icon className="h-10 w-10" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`whitespace-pre-line text-xl font-black uppercase leading-[0.9] tracking-tight drop-shadow-sm ${card.titleClass}`}>
                          {card.title}
                        </p>
                        <p className={`mt-2 max-w-[22rem] text-xs leading-snug sm:text-sm ${card.subtitleClass}`}>{card.subtitle}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.22em] ${card.tagClass}`}>
                            {card.module}
                          </span>
                          <ChevronRight className={`h-4 w-4 ${card.chevronClass}`} />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </section>
          </div>
        )}

        {shouldShowPillarDetail && (
          <div className="mx-auto w-full max-w-4xl space-y-6 pt-4 lg:w-3/4">
            <button onClick={() => setPillar(null)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a25125]">
              <ArrowLeft className="w-3.5 h-3.5" />
              {language === 'sw' ? 'Rudi kwenye mwanzo' : 'Back to mosaic'}
            </button>

            {pillar === 'rafiki' && (
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[32px] border border-[#e9d3c0] bg-white/95 backdrop-blur-sm p-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a6f4b]">Rafiki AI consultation</p>
                  <div className="mt-3 space-y-2 max-h-[46dvh] overflow-y-auto pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={`${msg.from}-${idx}`}
                        className={`rounded-3xl px-4 py-2.5 text-sm leading-snug border shadow-sm ${
                          msg.from === 'user'
                            ? 'bg-[#fbeee0] border-[#f0d4ba] ml-10 text-[#2d1a11]'
                            : 'bg-[#f7fff7] border-[#d9f1de] mr-10 text-[#203127]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {rafikiThinking && (
                      <div className="rounded-3xl px-4 py-2.5 text-sm border bg-[#f7fff7] border-[#d9f1de] mr-10 text-[#203127]">
                        {language === 'sw' ? 'Rafiki anafikiria...' : 'Rafiki is thinking...'}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-3xl border border-[#e9d3c0] bg-white/90 p-2 flex items-center gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendRafiki()}
                      className="flex-1 bg-transparent outline-none text-sm px-1 text-[#2b1b12]"
                      placeholder={language === 'sw' ? 'Andika swali lako la afya...' : 'Type your health question...'}
                    />
                    <button
                      onClick={sendRafiki}
                      disabled={rafikiThinking}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0f2c22] text-white disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-[32px] border border-[#e9d3c0] bg-gradient-to-br from-white to-[#fff4eb] p-5 shadow-[0_25px_60px_rgba(31,20,12,0.12)]">
                  <p className="text-sm font-semibold text-[#5b4332]">{language === 'sw' ? 'Vidokezo vya Rafiki' : 'Rafiki Tips'}</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#5b4332] list-disc pl-5">
                    <li>{language === 'sw' ? 'Eleza dalili na muda wake waziwazi.' : 'Describe symptoms and timeline clearly.'}</li>
                    <li>{language === 'sw' ? 'Taja dawa unazotumia kwa sasa.' : 'Share current medications if any.'}</li>
                    <li>{language === 'sw' ? 'Kwa dharura, tumia Jirani mara moja.' : 'For emergencies, trigger Jirani immediately.'}</li>
                  </ul>
                </div>
              </div>
            )}

            {pillar === 'jirani' && (
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[32px] border border-[#cde5f6] bg-white/95 p-5 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#3e7aa0]">Jirani Network</p>
                  <div className="mt-3 space-y-3">
                    {sampleContacts.map((contact) => (
                      <div key={contact.name} className="rounded-2xl border border-[#d8ebf8] bg-[#f6fbff] px-3 py-2">
                        <p className="text-sm font-semibold text-[#1f4362]">{contact.name}</p>
                        <p className="text-xs text-[#486b88]">{contact.role} · {contact.distance} · {contact.status}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-[#f0d4ba] bg-gradient-to-br from-white to-[#fff2e7] p-5 shadow-sm">
                  <p className="text-sm font-semibold text-[#6f3a18]">{language === 'sw' ? 'Dharura ya Haraka' : 'Emergency Trigger'}</p>
                  <p className="mt-2 text-xs text-[#8c5a39]">
                    {language === 'sw'
                      ? 'Bonyeza kutuma tahadhari kwa mtandao wa jamii na wahudumu.'
                      : 'Press to notify nearby responders and community health workers.'}
                  </p>
                  <button
                    onClick={triggerEmergency}
                    disabled={emergencyState === 'sending'}
                    className="mt-4 w-full rounded-2xl bg-[#c85624] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {emergencyState === 'sending' && (language === 'sw' ? 'Inatuma...' : 'Sending...')}
                    {emergencyState === 'sent' && (language === 'sw' ? 'Imetumwa ✓' : 'Sent ✓')}
                    {emergencyState === 'error' && (language === 'sw' ? 'Imeshindikana' : 'Failed')}
                    {emergencyState === 'idle' && (language === 'sw' ? 'Tuma tahadhari ya dharura' : 'Send emergency alert')}
                  </button>
                </div>
              </div>
            )}

            {pillar === 'mlinzi' && (
              <div className="rounded-[32px] border border-[#e6e1c9] bg-white/95 p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d6f2a]">Mlinzi Heatmap</p>
                <p className="mt-1 text-sm text-[#5f5b43]">
                  {language === 'sw'
                    ? 'Ramani ya hatari ya kinga kulingana na vitongoji vya sasa.'
                    : 'Immunization risk map by current local clusters.'}
                </p>

                <div className="mt-3 relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/60 bg-[#f7faf5] shadow-inner">
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      backgroundImage: `url(${heatmapBackground})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />

                  <div className="absolute left-3 right-3 top-3 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#1f3a2f]">Low</span>
                    <div
                      className="h-2 flex-1 rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, #00b4d8 0%, #77dd77 20%, #ffe066 40%, #ffa94d 60%, #f3722c 80%, #e5383b 100%)',
                      }}
                    />
                    <span className="text-[10px] font-semibold text-[#1f3a2f]">High</span>
                  </div>

                  {heatCells.map((cell) => {
                    const pointColor =
                      cell.risk === 'High' ? '#e5383b' : cell.risk === 'Medium' ? '#ffa94d' : '#4ade80';

                    return (
                      <button
                        key={cell.id}
                        type="button"
                        onMouseEnter={() => setHoveredHeatCell(cell)}
                        onMouseLeave={() => setHoveredHeatCell(null)}
                        onFocus={() => setSelectedHeatCell(cell)}
                        onClick={() => setSelectedHeatCell(cell)}
                        className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1d4c37]"
                        style={{ left: `${cell.x}%`, top: `${cell.y}%`, backgroundColor: pointColor }}
                        title={`${cell.label}: ${cell.risk} risk`}
                      />
                    );
                  })}

                  <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/85 border border-white/60 px-3 py-2 shadow-sm backdrop-blur-md">
                    <p className="text-xs font-semibold text-[#1f3a2f]">
                      {activeHeatCell.label} · {activeHeatCell.risk} risk
                    </p>
                    <p className="mt-1 text-[11px] text-[#486454]">{activeHeatCell.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="mx-auto w-full max-w-4xl space-y-3 pt-4 pb-2 lg:w-3/4">
            {sampleMessages.map((msg) => (
              <div key={msg.title} className="rounded-2xl border border-[#d8eadc] bg-white/95 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#1f4a31]">{msg.title}</p>
                  <p className="text-[11px] text-[#6b7f71]">{msg.at}</p>
                </div>
                <p className="mt-1 text-xs text-[#5f6f63]">{msg.body}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div className="mx-auto w-full max-w-4xl space-y-3 pt-4 pb-2 lg:w-3/4">
            <div className="rounded-[28px] border border-[#d4e3d8] bg-white/95 backdrop-blur-sm p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-[#dce8de] px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#244431]">
                  <Languages className="h-4 w-4" />
                  {language === 'sw' ? 'Lugha' : 'Language'}
                </div>
                <button
                  onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                  className="rounded-full border border-[#cfe4d6] px-3 py-1 text-xs font-semibold bg-[#f2fbf6]"
                >
                  {language === 'en' ? 'EN' : 'SW'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#dce8de] px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#244431]">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                  {language === 'sw' ? 'Mandhari' : 'Theme'}
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-full border border-[#cfe4d6] px-3 py-1 text-xs font-semibold bg-[#f2fbf6]"
                >
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d4e3d8] bg-white/95 backdrop-blur-sm p-4 text-xs text-[#4c5a4f] shadow-sm">
              Demo patient: Amina Wanjiku · UPI-DEM-0001
            </div>
          </div>
        )}
      </main>

      <nav className="sticky bottom-0 z-20 px-3 pb-3 pt-2 md:hidden">
        <div className="mx-auto max-w-md rounded-[24px] border border-[#dfe7da] bg-white px-3 py-2 shadow-[0_16px_40px_rgba(19,30,22,0.14)]">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                setTab('home');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
                tab === 'home' ? 'text-[#40914a]' : 'text-[#8c857d]'
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => {
                setTab('messages');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
                tab === 'messages' ? 'text-[#40914a]' : 'text-[#8c857d]'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </button>
            <button
              onClick={() => {
                setTab('settings');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
                tab === 'settings' ? 'text-[#40914a]' : 'text-[#8c857d]'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </nav>

      <nav className="hidden sticky bottom-4 px-4 md:px-0 md:block">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#e9d3c0] bg-white/90 backdrop-blur-lg shadow-[0_30px_80px_rgba(31,20,12,0.18)] px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setTab('home');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'home' ? 'bg-[#0f2c22] text-white' : 'text-[#7a5c47]'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => {
                setTab('messages');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'messages' ? 'bg-[#c85624] text-white' : 'text-[#7a5c47]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </button>
            <button
              onClick={() => {
                setTab('settings');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'settings' ? 'bg-[#f2eadd] text-[#1f140c]' : 'text-[#7a5c47]'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;

/*
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  FileHeart,
  Heart,
  Home,
  Languages,
  MessageSquare,
  Moon,
  Pill,
  Send,
  Settings,
  Shield,
  Stethoscope,
  SunMedium,
  Users,
} from 'lucide-react';
import { askRafikiAI, createAlert } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useMsaidizi } from '@/components/msaidizi/MsaidiziProvider';


    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', updateIsDark);
      return () => mq.removeEventListener('change', updateIsDark);
    }
  }, [theme]);

  const mobileShortcutCards = useMemo(
    () => {
      const rafikiIsDark = theme === 'dark';
      const rafikiSubtitleEn = 'Chat with your AI companion for fast guidance.';
      const rafikiSubtitleSw = 'Zungumza na msaidizi wako wa afya wa AI kwa msaada wa haraka.';
      const jiraniSubtitleEn = 'See trusted neighbours, CHVs and responders around you.';
      const jiraniSubtitleSw = 'Tazama majirani, wahudumu wa jamii na waokoaji wanaokuuzunguka.';
      const mlinziSubtitleEn = 'Capture your vitals and keep an eye on risk.';
      const mlinziSubtitleSw = 'Hifadhi vipimo vyako na fuatilia hatari kwa urahisi.';

      return [
        {
          id: 'rafiki' as PillarId,
          module: 'RAFIKI',
          title: 'ASK\nRAFIKI',
          subtitle: language === 'sw' ? rafikiSubtitleSw : rafikiSubtitleEn,
          icon: Bot,
          classes: rafikiIsDark
            ? 'from-white via-white to-[#f5f5f7]'
            : 'from-[#3a3a3f] via-[#212126] to-[#0b0b0f]',
          titleClass: rafikiIsDark ? 'text-[#111827]' : 'text-white',
          subtitleClass: rafikiIsDark ? 'text-slate-700' : 'text-white',
          tagClass: rafikiIsDark
            ? 'border-black/10 bg-black/5 text-[#111827]'
            : 'border-white/25 bg-black/10 text-white',
          chevronClass: rafikiIsDark ? 'text-[#4b5563]' : 'text-white',
        },
        {
          id: 'jirani' as PillarId,
          module: 'JIRANI',
          title: 'JIRANI\nNETWORK',
          subtitle: language === 'sw' ? jiraniSubtitleSw : jiraniSubtitleEn,
          icon: Users,
          classes: 'from-[#4aa8d7] via-[#2f89bf] to-[#216a9b]',
          titleClass: 'text-white',
          subtitleClass: 'text-white/92',
          tagClass: 'border-white/25 bg-black/10 text-white/90',
          chevronClass: 'text-white/90',
        },
        {
          id: 'mlinzi' as PillarId,
          module: 'MLINZI',
          title: 'MLINZI\nVITALS',
          subtitle: language === 'sw' ? mlinziSubtitleSw : mlinziSubtitleEn,
          icon: Shield,
          classes: 'from-[#e9a331] via-[#c87712] to-[#a85d08]',
          titleClass: 'text-white',
          subtitleClass: 'text-white/92',
          tagClass: 'border-white/25 bg-black/10 text-white/90',
          chevronClass: 'text-white/90',
        },
      ];
    },
    [theme, language]
  );
    const updateIsDark = () => {
      setIsDark(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    };

    updateIsDark();
  const mobileShortcutCards = useMemo(
    () => {
      const rafikiIsDark = theme === 'dark';
      const rafikiSubtitleEn = 'Chat with your AI companion for fast guidance.';
      const rafikiSubtitleSw = 'Zungumza na msaidizi wako wa afya wa AI kwa msaada wa haraka.';
      const jiraniSubtitleEn = 'See trusted neighbours, CHVs and responders around you.';
      const jiraniSubtitleSw = 'Tazama majirani, wahudumu wa jamii na waokoaji wanaokuuzunguka.';
      const mlinziSubtitleEn = 'Capture your vitals and keep an eye on risk.';
      const mlinziSubtitleSw = 'Hifadhi vipimo vyako na fuatilia hatari kwa urahisi.';

      return [
        {
          id: 'rafiki' as PillarId,
          module: 'RAFIKI',
          title: 'ASK\nRAFIKI',
          subtitle: language === 'sw' ? rafikiSubtitleSw : rafikiSubtitleEn,
          icon: Bot,
          classes: rafikiIsDark
            ? 'from-white via-white to-[#f5f5f7]'
            : 'from-[#3a3a3f] via-[#212126] to-[#0b0b0f]',
          titleClass: rafikiIsDark ? 'text-[#111827]' : 'text-white',
          subtitleClass: rafikiIsDark ? 'text-slate-700' : 'text-white',
          tagClass: rafikiIsDark
            ? 'border-black/10 bg-black/5 text-[#111827]'
            : 'border-white/25 bg-black/10 text-white',
          chevronClass: rafikiIsDark ? 'text-[#4b5563]' : 'text-white',
        },
        {
          id: 'jirani' as PillarId,
          module: 'JIRANI',
          title: 'JIRANI\nNETWORK',
          subtitle: language === 'sw' ? jiraniSubtitleSw : jiraniSubtitleEn,
          icon: Users,
          classes: 'from-[#4aa8d7] via-[#2f89bf] to-[#216a9b]',
          titleClass: 'text-white',
          subtitleClass: 'text-white/92',
          tagClass: 'border-white/25 bg-black/10 text-white/90',
          chevronClass: 'text-white/90',
        },
        {
          id: 'mlinzi' as PillarId,
          module: 'MLINZI',
          title: 'MLINZI\nVITALS',
          subtitle: language === 'sw' ? mlinziSubtitleSw : mlinziSubtitleEn,
          icon: Shield,
          classes: 'from-[#e9a331] via-[#c87712] to-[#a85d08]',
          titleClass: 'text-white',
          subtitleClass: 'text-white/92',
          tagClass: 'border-white/25 bg-black/10 text-white/90',
          chevronClass: 'text-white/90',
        },
      ];
    },
    [theme, language]
  );

  const heatCells: HeatCell[] = [
    {
      id: 'gatanga-north',
      label: 'Gatanga North',
      risk: 'High',
      recommendation: 'Government to roll out vaccine X in this cluster and deploy extra CHVs for follow up.',
      x: 32,
      y: 28,
    },
    {
      id: 'gatanga-south',
      label: 'Gatanga South',
      risk: 'Medium',
      recommendation: 'Scale up outreach clinics and SMS nudges for caregivers this week.',
      x: 36,
      y: 46,
    },
    {
      id: 'kandara',
      label: 'Kandara',
      risk: 'High',
      recommendation: 'Activate mobile vaccination teams; coordinate with county logistics.',
      x: 44,
      y: 58,
    },
    {
      id: 'kiharu',
      label: 'Kiharu',
      risk: 'Low',
      recommendation: 'Monitor routinely; no urgent action needed.',
      x: 56,
      y: 32,
    },
    {
      id: 'maragua',
      label: 'Maragua',
      risk: 'High',
      recommendation: 'Rapid response team to investigate spikes and allocate vaccine X stock.',
      x: 60,
      y: 52,
    },
    {
      id: 'kangema',
      label: 'Kangema',
      risk: 'Low',
      recommendation: 'Keep current clinic days and support CHVs with airtime.',
      x: 68,
      y: 24,
    },
    {
      id: 'mathioya',
      label: 'Mathioya',
      risk: 'Medium',
      recommendation: 'Community radio campaign on early symptom reporting.',
      x: 72,
      y: 40,
    },
    {
      id: 'muranga-town',
      label: "Murang'a Town",
      risk: 'High',
      recommendation: 'Scale up vaccination drive at the market and bus stage.',
      x: 54,
      y: 70,
    },
  ];

  const heatmapBackground =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%2300b4d8'/><stop offset='20%' stop-color='%2377dd77'/><stop offset='40%' stop-color='%23ffe066'/><stop offset='60%' stop-color='%23ffa94d'/><stop offset='80%' stop-color='%23f3722c'/><stop offset='100%' stop-color='%23e5383b'/></linearGradient></defs><rect x='0' y='0' width='400' height='300' fill='url(%23g1)' opacity='0.95'/><rect x='20' y='30' width='360' height='240' fill='url(%23g1)' opacity='0.45'/></svg>";
        const patientId = patientData?.id || DEMO_PATIENT_ID;

        const [contactsRes, recordsRes, messagesRes, vitalsRes] = await Promise.all([
          supabase
            .from('jirani_network')
            .select('*')
            .eq('patient_id', patientId)
            .order('priority', { ascending: true })
            .limit(8),
          supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', patientId)
            .order('recorded_at', { ascending: false })
            .limit(8),
          supabase.from('notification_log').select('*').order('created_at', { ascending: false }).limit(10),
          supabase
            .from('clinical_vitals')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        if (!isMounted) return;

        setPatient(patientData || null);
        setContacts(contactsRes.error ? [] : contactsRes.data || []);
        setRecords(recordsRes.error ? [] : recordsRes.data || []);
        setMessages(messagesRes.error ? [] : messagesRes.data || []);
        const latest = vitalsRes.error ? null : vitalsRes.data?.[0] || null;
        setLatestVitals(latest);
      } catch (error) {
        console.error('[Index] Failed to load demo data', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setActiveRole('patient-demo');
  }, [setActiveRole]);

  useEffect(() => {
    if (tab === 'home' && !pillar) {
      setActiveView('home');
      return;
    }
    if (pillar) {
      setActiveView(pillar);
      return;
                          <div className="mt-3 relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/60 bg-[#f7faf5] shadow-inner">
                            <div
                              className="absolute inset-0 opacity-90"
                              style={{ backgroundImage: `url(${heatmapBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                            />

                            <div className="absolute left-3 right-3 top-3 flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-[#1f3a2f]">Low</span>
                              <div
                                className="h-2 flex-1 rounded-full"
                                style={{
                                  background:
                                    'linear-gradient(90deg, #00b4d8 0%, #77dd77 20%, #ffe066 40%, #ffa94d 60%, #f3722c 80%, #e5383b 100%)',
                                }}
                              />
                              <span className="text-[10px] font-semibold text-[#1f3a2f]">High</span>
                            </div>

                            {heatCells.map((cell) => {
                              const ringColor =
                                cell.risk === 'High' ? '#e5383b' : cell.risk === 'Medium' ? '#ffa94d' : '#4ade80';
                              return (
                                <button
                                  key={cell.id}
                                  type="button"
                                  onMouseEnter={() => setHoveredHeatCell(cell)}
                                  onMouseLeave={() => setHoveredHeatCell(null)}
                                  onFocus={() => setSelectedHeatCell(cell)}
                                  onClick={() => setSelectedHeatCell(cell)}
                                  className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1d4c37]"
                                  style={{ left: `${cell.x}%`, top: `${cell.y}%`, backgroundColor: ringColor }}
                                  title={`${cell.label}: ${cell.risk} risk`}
                                />
                              );
                            })}

                            <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/85 border border-white/60 px-3 py-2 shadow-sm backdrop-blur-md">
                              <p className="text-xs font-semibold text-[#1f3a2f]">
                                {activeHeatCell.label} · {activeHeatCell.risk} risk
                              </p>
                              <p className="mt-1 text-[11px] text-[#486454]">{activeHeatCell.recommendation}</p>
                            </div>
                          </div>
    setEmergencyState('sending');
    try {
      await createAlert({
        patient_name: patient?.name || 'Amina Wanjiku',
        phone: patient?.phone || '+254712345678',
        symptom: 'Manual demo emergency alert',
        severity: 'high',
        location: patient?.location || 'Murang’a Ward',
        source: 'Demo',
        alert_type: 'emergency',
      });
      setEmergencyState('sent');
      setTimeout(() => setEmergencyState('idle'), 4000);
    } catch (error) {
      console.error('[Alerts] Failed to trigger emergency', error);
      setEmergencyState('error');
      setTimeout(() => setEmergencyState('idle'), 4000);
    }
  };

  const shouldShowPillarHome = tab === 'home' && !pillar;
  const shouldShowPillarDetail = tab === 'home' && !!pillar;
  const patientName = patient?.name || 'Amina Wanjiku';
  const patientLocation = patient?.location || "Murang’a Ward";
  const patientCounty = patient?.ward || 'Gatanga Ward';
  const messagePreview = messages.slice(0, 3);
  const recordPreview = records.slice(0, 4);
  const contactPreview = contacts.slice(0, 3);
  const lastNotification = messages[0];
  const lastNotificationTime = lastNotification ? formatTime(lastNotification.created_at) : null;
  const activeHeatCell = hoveredHeatCell || selectedHeatCell || heatCells[0];

  const sampleContacts = [
    {
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data: patientData } = await supabase.from('patients').select('*').eq('upi', DEMO_UPI).maybeSingle();
        const patientId = patientData?.id || DEMO_PATIENT_ID;

        const [contactsRes, recordsRes, messagesRes, vitalsRes] = await Promise.all([
          supabase
            .from('jirani_network')
            .select('*')
            .eq('patient_id', patientId)
            .order('priority', { ascending: true })
            .limit(8),
          supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', patientId)
            .order('recorded_at', { ascending: false })
            .limit(8),
          supabase.from('notification_log').select('*').order('created_at', { ascending: false }).limit(10),
          supabase
            .from('clinical_vitals')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        if (!isMounted) return;

        setPatient(patientData || null);
        setContacts(contactsRes.error ? [] : contactsRes.data || []);
        setRecords(recordsRes.error ? [] : recordsRes.data || []);
        setMessages(messagesRes.error ? [] : messagesRes.data || []);
        const latest = vitalsRes.error ? null : vitalsRes.data?.[0] || null;
        setLatestVitals(latest);
      } catch (error) {
        console.error('[Index] Failed to load demo data', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);
    >
      <header className="px-4 pt-3 pb-1">
        <div className="mx-auto w-full max-w-4xl rounded-[24px] border border-[#d9e4d2] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(31,20,12,0.08)] lg:w-3/4">
          <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4 sm:grid-cols-[64px_1fr_auto]">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#d2ddcc] bg-[#f0f7ef] shadow-inner">
              <img src="/Dawa-Mashinani-favicon.svg" alt="Dawa Mashinani profile" className="h-9 w-9 object-contain" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.6em] text-[#0c4c31]">DAWA</p>
              <p className="-mt-1 text-base font-black tracking-[0.52em] text-[#163726]">MASHINANI</p>
            </div>
            <div className="rounded-full border border-[#8bc196] bg-[#e8f6ea] px-4 py-1 text-[11px] font-semibold text-[#2f7f43] shadow-sm">
              Online
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 pb-24 md:px-8 md:pb-4">
        {loading ? (
          <div className="px-3 py-10 text-sm text-[#6e5240]">Loading the live mosaic...</div>
        ) : (
          <>
            {shouldShowPillarHome && (
              <div className="mx-auto w-full max-w-4xl space-y-3 pt-4 pb-2 lg:w-3/4">
                <section className="space-y-4">
                  {mobileShortcutCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <motion.button
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.35 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openPillar(card.id)}
                        className={`relative w-full overflow-hidden rounded-[24px] border border-white/35 bg-gradient-to-r ${card.classes} px-4 py-2 text-left shadow-[0_16px_36px_rgba(25,30,22,0.16)]`}
                      >
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage:
                              'linear-gradient(135deg, rgba(255,255,255,0.14) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.14) 75%, transparent 75%, transparent)',
                            backgroundSize: '18px 18px',
                          }}
                        />
                        <div className="relative flex items-center gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/30 bg-white/15 shadow-inner backdrop-blur-sm">
                            <Icon className="h-10 w-10" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`whitespace-pre-line text-xl font-black uppercase leading-[0.9] tracking-tight drop-shadow-sm ${card.titleClass}`}>
                              {card.title}
                            </p>
                            <p className={`mt-2 max-w-[22rem] text-xs leading-snug sm:text-sm ${card.subtitleClass}`}>
                              {card.subtitle}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.22em] ${card.tagClass}`}>
                                {card.module}
                              </span>
                              <ChevronRight className={`h-4 w-4 ${card.chevronClass}`} />
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </section>
              </div>
            )}

            {shouldShowPillarDetail && (
              <div className="space-y-6 pt-4">
                <button
                  onClick={() => setPillar(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a25125]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to mosaic
                </button>

                {pillar === 'rafiki' && (
                  <div className="space-y-5">
                    <div className="rounded-[32px] border border-[#e9d3c0] bg-gradient-to-br from-white to-[#fff4eb] p-5 shadow-[0_25px_60px_rgba(31,20,12,0.12)]">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-[#9a6f4b]">Rafiki AI consultation</p>
                      <p className="text-sm text-[#5b4332]">Ask symptoms, medication questions, or triage guidance.</p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-[32px] border border-[#e9d3c0] bg-white/95 backdrop-blur-sm p-4 shadow-sm">
                        <div className="space-y-2 max-h-[48dvh] overflow-y-auto pr-1">
                          {chatMessages.map((msg, idx) => (
                            <div
                              key={`${msg.from}-${idx}`}
                              className={`rounded-3xl px-4 py-2.5 text-sm leading-snug border shadow-sm ${
                                msg.from === 'user'
                                  ? 'bg-[#fbeee0] border-[#f0d4ba] ml-10 text-[#2d1a11]'
                                  : 'bg-[#f7fff7] border-[#d9f1de] mr-10 text-[#203127]'
                              }`}
                            >
                              {msg.text}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 rounded-3xl border border-[#e9d3c0] bg-white/90 p-2 flex items-center gap-2">
                          <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendRafiki()}
                            className="flex-1 bg-transparent outline-none text-sm px-1 text-[#2b1b12]"
                            placeholder="Type your health question..."
                          />
                          <button
                            onClick={sendRafiki}
                            disabled={rafikiThinking}
                            className="w-11 h-11 rounded-2xl bg-[#c85624] text-white flex items-center justify-center disabled:opacity-60"
                          >
                            {rafikiThinking ? '...' : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="rounded-[32px] border border-[#e9d3c0] bg-[#fff6ed] p-5 shadow-sm">
                        <p className="text-sm text-[#6b4e3a]">
                          Rafiki summarises context + suggests next steps. Re-play the onboarding clip if you need a refresher.
                        </p>
                        <button
                          onClick={() =>
                            speak(
                              'Rafiki is ready. Ask about symptoms, medicines, or what to do next and you will get an instant summary.',
                              'Rafiki yuko tayari. Uliza dalili, dawa, au hatua inayofuata ili upate muhtasari wa haraka.',
                              9000
                            )
                          }
                          className="mt-4 rounded-full border border-[#e0c4a8] px-4 py-2 text-xs font-semibold text-[#8a5b3a] hover:bg-white/40"
                        >
                          Play voice brief
                        </button>
                        <div className="mt-5 space-y-3 text-sm text-[#4a372b]">
                          {messagePreview.slice(0, 2).map((message) => (
                            <div key={message.id} className="rounded-2xl bg-white border border-[#f0d9c4] px-3 py-2">
                              <p>{message.message_content || 'Notification update'}</p>
                              <p className="text-[11px] text-[#94715a] mt-1">{formatTime(message.created_at)}</p>
                            </div>
                          ))}
                          {messagePreview.length === 0 && <p className="text-sm">No live notifications inside this view.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {pillar === 'jirani' && (
                  <div className="space-y-5">
                    <div className="rounded-[32px] border border-[#d7c2b4] bg-gradient-to-br from-white to-[#fbf5ef] p-5 shadow-[0_25px_60px_rgba(31,20,12,0.12)]">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-[#7b5c45]">Jirani ledger</p>
                      <p className="text-sm text-[#564031]">Trusted contacts and latest verified records.</p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-[32px] border border-[#d9e6db] bg-white/95 backdrop-blur-sm p-4 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-[#4b6b56]">Trusted contacts</p>
                        <div className="mt-3 space-y-3">
                          {jiraniContacts.length ? (
                            jiraniContacts.map((contact) => (
                              <div key={contact.id} className="flex items-center justify-between border-b border-[#edf2ee] pb-2">
                                <div>
                                  <p className="font-semibold text-[#1d3226]">{contact.contact_name}</p>
                                  <p className="text-[12px] text-[#4b6c5a]">{contact.contact_phone}</p>
                                </div>
                                <p className="text-[10px] font-bold text-[#1f4b36] uppercase">{(contact.contact_type || 'ALLY').toUpperCase()}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-[#4c5a4f]">No contacts yet.</p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-[32px] border border-[#e0d2c8] bg-white/95 backdrop-blur-sm p-4 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8c6a4c]">Health records</p>
                        <div className="mt-3 space-y-3">
                          {jiraniRecords.length ? (
                            jiraniRecords.map((record) => (
                              <div key={record.id} className="border-b border-[#f0e4d8] pb-2">
                                <p className="font-semibold text-[#321f13]">{record.code}</p>
                                <p className="text-xs text-[#725643]">{record.value}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-[#5f4c3f]">No records yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {pillar === 'mlinzi' && (
                  <div className="space-y-5">
                    <div className="rounded-[32px] border border-[#cfe2d7] bg-gradient-to-br from-white to-[#eef8f3] p-5 shadow-[0_25px_60px_rgba(20,51,34,0.12)]">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-[#3e6552]">Mlinzi vitals</p>
                      <p className="text-sm text-[#395045]">Capture quick vitals and trigger emergency alerts.</p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-[32px] border border-[#cfe2d7] bg-white/95 backdrop-blur-sm p-5 shadow-sm space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={vitalInput.pulse}
                            onChange={(e) => setVitalInput((prev) => ({ ...prev, pulse: e.target.value }))}
                            placeholder="Pulse"
                            className="rounded-2xl border border-[#dbece2] bg-[#f4faf7] px-3 py-2 text-sm"
                          />
                          <input
                            type="number"
                            value={vitalInput.temperature}
                            onChange={(e) => setVitalInput((prev) => ({ ...prev, temperature: e.target.value }))}
                            placeholder="Temp °C"
                            className="rounded-2xl border border-[#dbece2] bg-[#f4faf7] px-3 py-2 text-sm"
                          />
                          <input
                            type="number"
                            value={vitalInput.bpSystolic}
                            onChange={(e) => setVitalInput((prev) => ({ ...prev, bpSystolic: e.target.value }))}
                            placeholder="BP SYS"
                            className="rounded-2xl border border-[#dbece2] bg-[#f4faf7] px-3 py-2 text-sm"
                          />
                          <input
                            type="number"
                            value={vitalInput.bpDiastolic}
                            onChange={(e) => setVitalInput((prev) => ({ ...prev, bpDiastolic: e.target.value }))}
                            placeholder="BP DIA"
                            className="rounded-2xl border border-[#dbece2] bg-[#f4faf7] px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          onClick={saveVitals}
                          disabled={savingVitals}
                          className="w-full rounded-2xl bg-[#1d4c37] text-white py-2.5 text-sm font-semibold disabled:opacity-60"
                        >
                          {savingVitals ? 'Saving...' : 'Save vitals'}
                        </button>
                        <button
                          onClick={triggerEmergency}
                          className="w-full rounded-2xl bg-[#c85624] text-white py-2.5 text-sm font-semibold"
                        >
                          {emergencyState === 'sending'
                            ? 'Sending emergency...'
                            : emergencyState === 'sent'
                            ? 'Emergency dispatched'
                            : emergencyState === 'error'
                            ? 'Retry emergency alert'
                            : 'Trigger demo emergency alert'}
                        </button>
                      </div>
                      <div className="rounded-[32px] border border-[#cfe2d7] bg-gradient-to-br from-[#f1fbf6] to-[#e2f4ea] p-5 shadow-sm space-y-4">
                        <div>
                          <p className="text-sm text-[#304c3d]">Latest reading</p>
                          <p className="text-lg font-display text-[#1f3a2f] mt-1">
                            Pulse {latestVitals?.pulse ?? '--'} · Temp {latestVitals?.temperature ?? '--'}°C · BP {latestVitals?.bp_systolic ?? '--'}/{latestVitals?.bp_diastolic ?? '--'}
                          </p>
                          <p className="text-[11px] text-[#466356] mt-2">
                            {latestVitals?.created_at ? `Logged ${formatTime(latestVitals.created_at)}` : 'No vitals saved yet.'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#385846]">Risk heat map</p>
                          <div className="mt-2 grid grid-cols-3 gap-1">
                            const heatCells: HeatCell[] = [
                              {
                                id: 'gatanga-north',
                                label: 'Gatanga North',
                                risk: 'High',
                                recommendation: 'Government to roll out vaccine X in this cluster and deploy extra CHVs for follow up.',
                                x: 32,
                                y: 28,
                              },
                              {
                                id: 'gatanga-south',
                                label: 'Gatanga South',
                                risk: 'Medium',
                                recommendation: 'Scale up outreach clinics and SMS nudges for caregivers this week.',
                                x: 36,
                                y: 46,
                              },
                              {
                                id: 'kandara',
                                label: 'Kandara',
                                risk: 'High',
                                recommendation: 'Activate mobile vaccination teams; coordinate with county logistics.',
                                x: 44,
                                y: 58,
                              },
                              {
                                id: 'kiharu',
                                label: 'Kiharu',
                                risk: 'Low',
                                recommendation: 'Monitor routinely; no urgent action needed.',
                                x: 56,
                                y: 32,
                              },
                              {
                                id: 'maragua',
                                label: 'Maragua',
                                risk: 'High',
                                recommendation: 'Rapid response team to investigate spikes and allocate vaccine X stock.',
                                x: 60,
                                y: 52,
                              },
                              {
                                id: 'kangema',
                                label: 'Kangema',
                                risk: 'Low',
                                recommendation: 'Keep current clinic days and support CHVs with airtime.',
                                x: 68,
                                y: 24,
                              },
                              {
                                id: 'mathioya',
                                label: 'Mathioya',
                                risk: 'Medium',
                                recommendation: 'Community radio campaign on early symptom reporting.',
                                x: 72,
                                y: 40,
                              },
                              {
                                id: 'muranga-town',
                                label: "Murang'a Town",
                                risk: 'High',
                                recommendation: 'Scale up vaccination drive at the market and bus stage.',
                                x: 54,
                                y: 70,
                              },
                            ];

                            const heatmapBackground =
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' stop-color='%2300b4d8'/><stop offset='20%' stop-color='%2377dd77'/><stop offset='40%' stop-color='%23ffe066'/><stop offset='60%' stop-color='%23ffa94d'/><stop offset='80%' stop-color='%23f3722c'/><stop offset='100%' stop-color='%23e5383b'/></linearGradient></defs><rect x='0' y='0' width='400' height='300' fill='url(%23g1)' opacity='0.95'/><rect x='20' y='30' width='360' height='240' fill='url(%23g1)' opacity='0.45'/></svg>";
                  </div>
                ))}
              </div>
            )}

            {tab === 'settings' && (
              <div className="space-y-4 pt-4">
                <div className="rounded-[32px] border border-[#d4e3d8] bg-gradient-to-br from-white to-[#f4faf5] p-5 shadow-[0_25px_60px_rgba(20,51,34,0.12)]">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#4b6b56]">Demo settings</p>
                  <p className="text-sm text-[#374338]">Language, voice assistant, and display mode.</p>
                </div>

                <div className="rounded-[32px] border border-[#d4e3d8] bg-white/95 backdrop-blur-sm p-5 space-y-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#22362b]">
                      <Languages className="w-4 h-4" /> Language
                    </div>
                    <button
                      onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                      className="rounded-full border border-[#cfe4d6] px-3 py-1 text-xs font-semibold bg-[#f2fbf6]"
                    >
                      {language === 'en' ? 'English' : 'Swahili'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#22362b]">
                      <Heart className="w-4 h-4" /> Voice assistant
                    </div>
                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="rounded-full border border-[#cfe4d6] px-3 py-1 text-xs font-semibold bg-[#f2fbf6]"
                    >
                      {voiceEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#22362b]">
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <SunMedium className="w-4 h-4" />} Theme
                    </div>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="rounded-full border border-[#cfe4d6] px-3 py-1 text-xs font-semibold bg-[#f2fbf6]"
                    >
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#d4e3d8] bg-white/95 backdrop-blur-sm p-4 text-xs text-[#4c5a4f] shadow-sm">
                  Demo patient: {patientName} · {patient?.upi || DEMO_UPI}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <nav className="sticky bottom-0 z-20 px-3 pb-3 pt-2 md:hidden">
        <div className="mx-auto max-w-md rounded-[24px] border border-[#dfe7da] bg-white px-3 py-2 shadow-[0_16px_40px_rgba(19,30,22,0.14)]">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                setTab('home');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
                tab === 'home' ? 'text-[#40914a]' : 'text-[#8c857d]'
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => {
                setTab('messages');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
                tab === 'messages' ? 'text-[#40914a]' : 'text-[#8c857d]'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </button>
            <button
              onClick={() => {
                setTab('settings');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors ${
                tab === 'settings' ? 'text-[#40914a]' : 'text-[#8c857d]'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </nav>

      <nav className="hidden sticky bottom-4 px-4 md:px-0 md:block">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#e9d3c0] bg-white/90 backdrop-blur-lg shadow-[0_30px_80px_rgba(31,20,12,0.18)] px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setTab('home');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'home' ? 'bg-[#0f2c22] text-white' : 'text-[#7a5c47]'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => {
                setTab('messages');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'messages' ? 'bg-[#c85624] text-white' : 'text-[#7a5c47]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </button>
            <button
              onClick={() => {
                setTab('settings');
                setPillar(null);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[11px] font-semibold transition-colors ${
                tab === 'settings' ? 'bg-[#f2eadd] text-[#1f140c]' : 'text-[#7a5c47]'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;

*/
