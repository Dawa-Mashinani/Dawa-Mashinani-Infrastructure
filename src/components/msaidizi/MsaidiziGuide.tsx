import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Languages } from 'lucide-react';
import { useMsaidizi, type VoiceType } from './MsaidiziProvider';

export default function MsaidiziGuide() {
  const {
    isOpen, language, setLanguage,
    voiceEnabled, setVoiceEnabled, voiceType, setVoiceType,
    currentMessage, tourActive, endTour, currentStep, totalSteps,
    tourVisible, tourBootReady, setTourBootReady,
    speak, startTour
  } = useMsaidizi();

  const toggleLang = () => setLanguage(language === 'en' ? 'sw' : 'en');

  const handleIconClick = () => {
    if (!tourBootReady) {
      // Force voice on (updates ref immediately) then speak in user-gesture context
      setVoiceEnabled(true);
      setTourBootReady(true);
      speak(
        "Jambo, I'm Msaidizi and I'll give you a quick tour on the Dawa Mashinani platform.",
        'Jambo, mimi ni Msaidizi na nitakuelekeza kwa haraka kwenye jukwaa la Dawa Mashinani.',
        9000,
        () => { startTour(); }
      );
      return;
    }
    // During tour: end immediately
    endTour();
  };

  if (!tourVisible) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        drag
        dragMomentum={false}
        dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
        whileDrag={{ scale: 1.15, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
        className="fixed bottom-[4.5rem] right-5 w-14 h-14 bg-white border-2 border-primary/30 rounded-full shadow-xl flex items-center justify-center z-[100] overflow-hidden touch-none"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={handleIconClick}
      >
        <img src="/Dawa-Mashinani-favicon.svg" alt="Msaidizi" className="w-9 h-9 object-contain" />
      </motion.button>

      {/* Speech bubble prompt before tour starts */}
      <AnimatePresence>
        {!tourBootReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.4 }}
            className="fixed bottom-[4.5rem] right-[5.5rem] z-[100] pointer-events-none"
          >
            <div className="relative bg-white border border-border/60 shadow-xl rounded-2xl px-4 py-3 max-w-[210px]">
              <p className="text-[13px] font-medium text-foreground leading-snug">
                {language === 'en'
                  ? "Hi, I'm Msaidizi! 👋 Click me to start your guided tour."
                  : 'Habari, mimi ni Msaidizi! 👋 Nibonyeze kuanza ziara yako.'}
              </p>
              {/* Triangle pointer towards the icon */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-white" />
              <div className="absolute top-1/2 -translate-y-1/2 -right-[9px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-border/60" style={{ zIndex: -1 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Panel */}
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

            {/* Quick settings row */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
