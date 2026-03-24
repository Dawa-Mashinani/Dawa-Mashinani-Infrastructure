import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Languages, ChevronRight } from 'lucide-react';
import { useMsaidizi, type VoiceType } from './MsaidiziProvider';

/* Contextual explanations keyed by active view in the no-login app */
const CONTEXT_MAP: Record<string, { en: string; sw: string }> = {
  home: {
    en: 'You are on Home. Tap a pillar card to open Rafiki AI, Jirani Ledger, or Mlinzi Vitals.',
    sw: 'Uko kwenye Nyumbani. Gusa kadi ya nguzo kufungua Rafiki AI, Jirani Ledger, au Mlinzi Vitals.'
  },
  rafiki: {
    en: 'This is Rafiki AI. Ask symptoms, treatment questions, or triage guidance and get a quick response.',
    sw: 'Hii ni Rafiki AI. Uliza dalili, maswali ya matibabu, au mwongozo wa triage upate jibu la haraka.'
  },
  jirani: {
    en: 'This is Jirani Ledger. You can review trusted contacts and recent health records from Supabase.',
    sw: 'Hii ni Jirani Ledger. Unaweza kuona mawasiliano ya kuaminika na rekodi za afya za hivi karibuni kutoka Supabase.'
  },
  mlinzi: {
    en: 'This is Mlinzi Vitals. Save pulse, blood pressure, and temperature, then monitor your latest reading.',
    sw: 'Hii ni Mlinzi Vitals. Hifadhi mpigo wa moyo, pressure ya damu, na joto, kisha fuatilia kipimo chako cha mwisho.'
  },
  messages: {
    en: 'This is Messages. You can see live notification updates from emergency and response workflows.',
    sw: 'Hii ni Messages. Unaweza kuona masasisho ya arifa za moja kwa moja kutoka mifumo ya dharura na mwitikio.'
  },
  settings: {
    en: 'This is Settings. You can change language, assistant voice, and app theme quickly.',
    sw: 'Hii ni Settings. Unaweza kubadilisha lugha, sauti ya msaidizi, na mandhari ya app kwa haraka.'
  }
};

export default function MsaidiziGuide() {
  const { 
    isOpen, setIsOpen, language, setLanguage, 
    voiceEnabled, setVoiceEnabled, voiceType, setVoiceType,
    currentMessage, tourActive, endTour, currentStep, totalSteps, nextStep,
    speak, activeView
  } = useMsaidizi();

  const toggleLang = () => setLanguage(language === 'en' ? 'sw' : 'en');

  const handleIconClick = () => {
    if (!voiceEnabled) setVoiceEnabled(true);
    window.speechSynthesis.resume();

    // During tour: just toggle the panel
    if (tourActive) {
      setIsOpen(!isOpen);
      return;
    }
    // Panel already open with context message → close it
    if (isOpen && currentMessage) {
      setIsOpen(false);
      window.speechSynthesis.cancel();
      return;
    }
    if (!activeView) {
      speak(
        'Welcome to Dawa Mashinani. You are already inside the app. Tap any pillar card to begin.',
        'Karibu Dawa Mashinani. Umeingia moja kwa moja ndani ya app. Gusa kadi yoyote ya nguzo kuanza.',
        9000
      );
      return;
    }

    const explanation = CONTEXT_MAP[activeView];
    if (explanation) {
      speak(explanation.en, explanation.sw, 12000);
      return;
    }

    // Fallback
    speak(
      "Tap any section and I'll explain what you see.",
      'Gusa sehemu yoyote nitakueleza unachoona.',
      8000
    );
  };
  
  return (
    <>
      {/* Floating Button — draggable, sits above BottomNav */}
      <motion.button
        drag
        dragMomentum={false}
        dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
        whileDrag={{ scale: 1.15, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
        className="fixed bottom-[4.5rem] right-5 w-14 h-14 bg-white border-2 border-primary/30 rounded-full shadow-xl flex items-center justify-center z-[100] overflow-hidden touch-none"
        animate={tourActive ? { scale: [1, 1.08, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={handleIconClick}
      >
        {isOpen ? <X className="w-6 h-6 text-primary" /> : <img src="/Dawa-Mashinani-favicon.svg" alt="Msaidizi" className="w-9 h-9 object-contain" />}
      </motion.button>

      {/* Guide Panel — above the floating button */}
      <AnimatePresence>
        {isOpen && currentMessage && (
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-[9rem] right-5 w-[320px] bg-[#f1fbf4] border border-border shadow-2xl rounded-2xl overflow-hidden z-[100] flex flex-col cursor-grab active:cursor-grabbing"
          >
            {/* Header */}
            <div className="bg-[#f1fbf4] px-4 py-3 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-border/50">
                  <img src="/Dawa-Mashinani-favicon.svg" alt="Avatar" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm tracking-tight">MsaidiziGuide</h3>
                  {tourActive && totalSteps > 0 && (
                    <p className="text-[11px] text-muted-foreground font-medium">Step {currentStep}/{totalSteps}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-60">
                <button onClick={toggleLang} className="p-1.5 hover:bg-black/5 rounded-md hover:opacity-100 transition-opacity">
                  <Languages className="w-4 h-4" />
                </button>
                <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-1.5 hover:bg-black/5 rounded-md hover:opacity-100 transition-opacity">
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick settings row (Optional voice personality tweak) */}
            <div className="px-4 py-1.5 bg-[#f1fbf4] flex items-center justify-end text-[10px] border-b border-border/40">
              <select 
                value={voiceType} 
                onChange={(e) => setVoiceType(e.target.value as VoiceType)}
                className="bg-transparent border-none text-muted-foreground cursor-pointer focus:ring-0 w-20 p-0 text-[10px]"
              >
                <option value="lady">Lady Voice</option>
                <option value="man">Man Voice</option>
                <option value="boy">Boy Voice</option>
              </select>
            </div>

            {/* Message Area */}
            <div className="p-5 bg-white text-[13px] text-foreground leading-relaxed min-h-[80px]">
              {language === 'en' ? currentMessage.en : currentMessage.sw}
            </div>

            {/* Footer Actions */}
            {tourActive && (
              <div className="px-4 py-3 bg-white border-t border-border/60 flex items-center justify-between">
                <button 
                  onClick={endTour} 
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === 'en' ? 'Skip Tour' : 'Acha Ziara'}
                </button>
                {currentStep < totalSteps && (
                  <button 
                    onClick={nextStep}
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    {language === 'en' ? 'Next' : 'Endelea'} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {currentStep === totalSteps && (
                  <button 
                    onClick={endTour}
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    {language === 'en' ? 'Finish' : 'Maliza'} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
