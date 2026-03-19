import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Languages, ChevronRight } from 'lucide-react';
import { useMsaidizi, type VoiceType } from './MsaidiziProvider';

/* Contextual explanations keyed by role → tab */
const CONTEXT_MAP: Record<string, Record<string, { en: string; sw: string }>> = {
  patient: {
    home: {
      en: "You're on your Home screen. From here you can start a Rafiki AI consultation, view your Digital Afya ID, or use the tabs below to explore.",
      sw: "Uko kwenye ukurasa wa Nyumbani. Kutoka hapa unaweza kuanza mazungumzo na Rafiki AI, kuona Kitambulisho chako cha Afya, au kutumia vitufe hapa chini."
    },
    rafiki: {
      en: "This is Rafiki AI Chat — your personal health assistant. Type your symptoms or health questions below and Rafiki will guide you with advice.",
      sw: "Hii ni Rafiki AI Chat — msaidizi wako wa afya. Andika dalili au maswali yako hapa chini na Rafiki atakuongoza."
    },
    jirani: {
      en: "This is Jirani Health Ledger — your medical history secured with SHA-256. All your visit records from Community Health Promoters appear here.",
      sw: "Hii ni Jirani Health Ledger — historia yako ya matibabu iliyolindwa na SHA-256. Rekodi zako zote zinaonekana hapa."
    },
    mlinzi: {
      en: "This is Mlinzi Health Monitor — your predictive health dashboard. It shows your health score, trends, and personalized recommendations.",
      sw: "Hii ni Mlinzi Health Monitor — ukurasa wako wa afya. Unaonyesha alama yako ya afya, mienendo, na mapendekezo ya kibinafsi."
    },
    more: {
      en: "This is your Settings page. View your profile, manage privacy, change language, or switch roles and log out.",
      sw: "Hii ni ukurasa wa Mipangilio. Angalia wasifu, kudhibiti faragha, kubadilisha lugha, au kutoka."
    },
  },
  doctor: {
    home: {
      en: "You're on the Doctor Home. Here you see patient statistics, critical alerts, and a Quick Patient Lookup to search by name, phone, or UPI.",
      sw: "Uko kwenye ukurasa wa Daktari. Hapa unaona takwimu za wagonjwa, arifa muhimu, na kutafuta wagonjwa haraka."
    },
    patients: {
      en: "This is the Patient Registry — browse and manage all registered patients in your facility from the National Client Registry.",
      sw: "Hii ni Daftari la Wagonjwa — tafuta na usimamie wagonjwa wote waliosajiliwa katika kituo chako."
    },
    alerts: {
      en: "These are your Clinical Alerts — critical referrals from the USSD system and CHP network that need your urgent attention.",
      sw: "Hizi ni Arifa za Kliniki — rufaa muhimu kutoka mfumo wa USSD na mtandao wa CHPs zinazohitaji umakini wako."
    },
    more: {
      en: "This is your Settings page. View your doctor profile, manage your account, or switch roles and log out.",
      sw: "Hii ni ukurasa wa Mipangilio. Angalia wasifu wako, simamia akaunti, au ubadilishe jukumu na utoke."
    },
  },
  chp: {
    home: {
      en: "You're on the CHP Home. See pending alerts, acknowledged cases, and daily totals. Click any alert to acknowledge and navigate to the patient.",
      sw: "Uko kwenye ukurasa wa CHP. Ona arifa zinazosubiri, kesi zilizokubaliwa, na jumla za leo. Bofya arifa kuikubali."
    },
    alerts: {
      en: "This is the full Alerts feed — real-time triage showing all incoming reports from USSD and the app in your coverage area.",
      sw: "Hii ni mkondo kamili wa Arifa — triage ya wakati halisi inayoonyesha ripoti zote zinazoingia katika eneo lako."
    },
    referrals: {
      en: "This is the Referral Tracker — track household follow-up visits synced with eCHIS and ensure patients receive proper care.",
      sw: "Hii ni Kifuatiliaji cha Rufaa — fuatilia ziara za ufuatiliaji zilizosawazishwa na eCHIS. Hakikisha wagonjwa wanapata huduma."
    },
    more: {
      en: "This is your Settings page. View your CHP profile, manage your account, or switch roles and log out.",
      sw: "Hii ni ukurasa wa Mipangilio. Angalia wasifu wako, simamia akaunti, au ubadilishe jukumu na utoke."
    },
  },
};

export default function MsaidiziGuide() {
  const { 
    isOpen, setIsOpen, language, setLanguage, 
    voiceEnabled, setVoiceEnabled, voiceType, setVoiceType,
    currentMessage, tourActive, endTour, currentStep, totalSteps, nextStep,
    speak, activeView, activeRole
  } = useMsaidizi();

  const toggleLang = () => setLanguage(language === 'en' ? 'sw' : 'en');

  const handleIconClick = () => {
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
    // Landing page → re-show welcome
    if (activeView === 'landing') {
      speak(
        "Welcome! 😊 I'm Msaidizi, your guide. Choose a role below to explore Dawa Mashinani.",
        "Karibu! 😊 Mimi ni Msaidizi, kiongozi wako. Chagua jukumu hapa chini kuchunguza Dawa Mashinani.",
        10000
      );
      return;
    }
    // Login page
    if (activeView === 'login') {
      speak(
        "This is the demo login 😊 Type any name and ID to enter — inputs are not validated.",
        "Hii ni ukurasa wa kuingia wa demo 😊 Andika jina lolote na nambari kuingia.",
        10000
      );
      return;
    }
    // Dashboard → contextual explanation
    const roleMap = CONTEXT_MAP[activeRole];
    if (roleMap) {
      const explanation = roleMap[activeView];
      if (explanation) {
        speak(explanation.en, explanation.sw, 12000);
        return;
      }
    }
    // Fallback
    speak(
      "Tap any tab below to navigate, and I'll explain what you see!",
      "Bonyeza kitufe chochote hapa chini na nitakueleza!",
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
            className="fixed bottom-[9rem] right-5 w-[320px] bg-[#FAF7F5] border border-border shadow-2xl rounded-2xl overflow-hidden z-[100] flex flex-col cursor-grab active:cursor-grabbing"
          >
            {/* Header */}
            <div className="bg-[#FAF7F5] px-4 py-3 border-b border-border/60 flex items-center justify-between">
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
            <div className="px-4 py-1.5 bg-[#FAF7F5] flex items-center justify-end text-[10px] border-b border-border/40">
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
