import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, AlertCircle, Moon, Sun, Palette, Crown, RefreshCw, Key, LogOut, Download, X, Smartphone, Monitor, Check, ExternalLink, Info } from 'lucide-react';
import { generateName, remixName } from '../services/nameService';
import { EventCountdowns } from './EventCountdowns';

type Theme = {
  name: string;
  gradient: string;
  darkGradient: string;
  primary: string;
  secondary: string;
  accent: string;
  button: string;
  bgStart: string;
  bgMiddle: string;
  bgEnd: string;
  cardBg: string;
  cardBorder: string;
  blobColors: string[];
};

const THEMES: Record<string, Theme> = {
  cosmic: {
    name: "Kosmiczny Ametyst",
    gradient: "from-[#0d0121] via-[#09041a] to-[#02000d]",
    darkGradient: "from-purple-900/40 via-indigo-900/40 to-pink-900/40",
    primary: "text-purple-400",
    secondary: "text-[#df1380]",
    accent: "bg-[#df1380]",
    button: "from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 hover:shadow-[0_0_24px_rgba(168,85,247,0.4)]",
    bgStart: "#1a082e",
    bgMiddle: "#0f0729",
    bgEnd: "#060114",
    cardBg: "bg-[#140b2a]/65 border-purple-500/25 shadow-[0_16px_36px_rgba(168,85,247,0.1)]",
    cardBorder: "border-purple-500/25",
    blobColors: ["#df1380", "#8b5cf6", "#d946ef", "#4f46e5"]
  },
  aurora: {
    name: "Zorza Polarna",
    gradient: "from-[#011411] via-[#010c10] to-[#000508]",
    darkGradient: "from-teal-900/40 via-emerald-900/40 to-cyan-900/40",
    primary: "text-emerald-400",
    secondary: "text-teal-400",
    accent: "bg-emerald-500",
    button: "from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.4)]",
    bgStart: "#03281f",
    bgMiddle: "#051f1f",
    bgEnd: "#020a10",
    cardBg: "bg-[#061e1a]/65 border-emerald-500/25 shadow-[0_16px_36px_rgba(16,185,129,0.1)]",
    cardBorder: "border-emerald-500/25",
    blobColors: ["#10b981", "#06b6d4", "#14b8a6", "#0284c7"]
  },
  sunset: {
    name: "Płonący Zachód",
    gradient: "from-[#1d010b] via-[#10040d] to-[#050005]",
    darkGradient: "from-rose-900/40 via-orange-900/40 to-amber-900/40",
    primary: "text-rose-400",
    secondary: "text-amber-500",
    accent: "bg-rose-500",
    button: "from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:via-pink-500 hover:to-amber-400 hover:shadow-[0_0_24px_rgba(244,63,94,0.4)]",
    bgStart: "#350915",
    bgMiddle: "#1c0715",
    bgEnd: "#0d0107",
    cardBg: "bg-[#250913]/65 border-rose-500/25 shadow-[0_16px_36px_rgba(244,63,94,0.1)]",
    cardBorder: "border-rose-500/25",
    blobColors: ["#f43f5e", "#f59e0b", "#ef4444", "#ea580c"]
  }
};

type RemixData = {
  keepFirst: string[];
  keepSecond: string[];
};

export default function NameGenerator() {
  const [request, setRequest] = useState('');
  const [results, setResults] = useState<Array<{ first: string; second: string; reasoning?: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini_api_key'));
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(!apiKey);
  
  // Remix State
  const [remixingIndex, setRemixingIndex] = useState<{ index: number, part: 1 | 2 } | null>(null);
  const [remixes, setRemixes] = useState<Record<number, RemixData>>({});
  
  // Settings
  const [mode, setMode] = useState<'standard' | 'old'>('standard');
  const [currentTheme, setCurrentTheme] = useState<string>('cosmic');
  const darkMode = true;
  const [showSettings, setShowSettings] = useState(false);

  // PWA / App Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [installTab, setInstallTab] = useState<'ios' | 'android' | 'pc'>('ios');

  useEffect(() => {
    // Detect iframe environment
    setInIframe(window.self !== window.top);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-detect device for modal instructions
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setInstallTab('ios');
    } else if (/android/.test(ua)) {
      setInstallTab('android');
    } else {
      setInstallTab('pc');
    }

    // Check if running in standalone window (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerPwaInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsAppInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Installation request failed:", err);
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('sso_dark_mode', String(darkMode));
  }, [darkMode]);

  const theme = THEMES[currentTheme];

  const handleGenerate = async () => {
    if (!request.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);
    setRemixes({});
    
    if (!apiKey && showKeyModal) {
      // Proceeding with default key
    }

    try {
      const fixedFirst = mode === 'old' ? 'Old' : undefined;
      const data = await generateName(apiKey, request, 3, fixedFirst);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Nie udało się wygenerować imienia.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemix = async (index: number, first: string, second: string, partToChange: 1 | 2) => {
    setRemixingIndex({ index, part: partToChange });
    try {
      const data = await remixName(apiKey, first, second);
      setRemixes(prev => ({ ...prev, [index]: data }));
    } catch (err) {
      console.error(err);
      // Optional: Add a toast or small error for remix failure
    } finally {
      setRemixingIndex(null);
    }
  };

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('gemini_api_key', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setShowKeyModal(false);
      setError(null);
    } else {
      localStorage.removeItem('gemini_api_key');
      setApiKey(null);
      setShowKeyModal(false);
    }
  };

  const logoutKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey(null);
    setApiKeyInput('');
    setShowKeyModal(true);
  };
  const bgVariants = {
    animate: {
      backgroundPosition: ['0% 0%', '100% 100%', '0% 100%', '0% 0%'],
      transition: { duration: 30, repeat: Infinity, ease: "linear" }
    }
  };

  // Floating blob animation
  const blobVariants = {
    animate: (i: number) => ({
      x: [0, Math.random() * 100 - 50, 0],
      y: [0, Math.random() * 100 - 50, 0],
      scale: [1, 1.2, 0.9, 1],
      rotate: [0, Math.random() * 360, 0],
      transition: {
        duration: 15 + Math.random() * 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 2,
      },
    }),
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-700 font-sans overflow-x-hidden relative flex flex-col ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-white text-gray-800'}`}>
      
      {/* API Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border relative ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-white text-gray-800'}`}
            >
              <button 
                onClick={() => setShowKeyModal(false)}
                className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 transition-opacity"
              >
                <LogOut className="w-5 h-5 rotate-180" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl ${theme.accent} bg-opacity-20`}>
                  <Key className={`w-6 h-6 ${theme.primary}`} />
                </div>
                <h2 className="text-2xl font-bold font-display">Klucz API</h2>
              </div>
              
              <p className="text-sm opacity-70 mb-6 leading-relaxed">
                Aplikacja posiada domyślny klucz, ale możesz dodać własny (Google AI Studio), aby uniknąć limitów. Klucz zostanie zapisany tylko u Ciebie.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); saveApiKey(); }} className="space-y-4">
                <input
                  id="gemini-api-key"
                  name="api-key"
                  type="password"
                  autoComplete="current-password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Twój klucz API (opcjonalnie)..."
                  className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-gray-100 focus:border-rose-400'}`}
                />
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className={`flex-1 py-4 rounded-2xl font-bold shadow-lg bg-gradient-to-r ${theme.button} text-white transition-transform active:scale-95`}
                  >
                    Zapisz klucz
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className={`flex-1 py-4 rounded-2xl font-bold border transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Użyj domyślnego
                  </button>
                </div>
              </form>
              
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block mt-4 text-center text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity"
              >
                Skąd wziąć klucz? (Google AI Studio)
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background with Mesh Gradient feel */}
      <motion.div 
        variants={bgVariants}
        animate="animate"
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} bg-[length:400%_400%] -z-20 transition-all duration-1000`}
      />

      {/* Liquid Glass / Shifting Aurora Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={blobVariants}
            animate="animate"
            className="absolute rounded-full mix-blend-screen filter blur-[100px] opacity-55"
            style={{
              background: `radial-gradient(circle, ${
                theme.blobColors[i % theme.blobColors.length]
              }, transparent)`,
              width: `${400 + Math.random() * 350}px`,
              height: `${400 + Math.random() * 350}px`,
              left: `${(i * 15 + Math.random() * 10) % 100}%`,
              top: `${(i * 12 + Math.random() * 15) % 100}%`,
            }}
          />
        ))}
      </div>

      {/* Header / Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex flex-wrap gap-3 items-center justify-between">
        {/* Direct Theme Selectors */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/60 border border-white/5 backdrop-blur-md shadow-lg">
          {Object.entries(THEMES).map(([key, t]) => {
            const isActive = currentTheme === key;
            return (
              <button
                key={key}
                onClick={() => setCurrentTheme(key)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r ' + t.button + ' text-white shadow-md scale-[1.03]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent.replace('bg-', '') }} />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          {/* PWA Install Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={triggerPwaInstall}
            title="Zainstaluj jako aplikację"
            className="px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md transition-all border flex items-center gap-2 bg-gradient-to-r from-pink-500/25 to-indigo-500/25 border-pink-500/30 text-pink-300 hover:from-pink-500/35 hover:to-indigo-500/35"
          >
            <div className="relative">
              <Download className="w-4 h-4 animate-bounce" />
              {!isAppInstalled && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-slate-950" />
              )}
            </div>
            <span className="text-xs font-bold tracking-tight hidden sm:inline">Pobierz App</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logoutKey}
            title="Zmień API Key"
            className="p-2.5 rounded-full shadow-lg backdrop-blur-md transition-colors border bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            <Key className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`absolute top-20 right-4 z-40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${darkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/60 border-white/40'} w-64`}
          >
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Wybierz Motyw</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setCurrentTheme(key)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all border ${currentTheme === key ? `border-${t.primary.split('-')[1]}-400/50 bg-${t.primary.split('-')[1]}-400/10` : 'border-transparent'} ${darkMode ? 'text-slate-200 hover:bg-slate-700/50' : 'text-gray-700 hover:bg-white/50'}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA High-Fidelity Custom Installation Guide Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border relative overflow-hidden backdrop-blur-3xl transition-all duration-300 ${
                darkMode 
                  ? 'bg-slate-950/80 border-white/10 text-white shadow-pink-500/5' 
                  : 'bg-white/90 border-white/50 text-gray-800 shadow-xl'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-teal-500" />
              
              <button 
                onClick={() => setShowInstallModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-white/70 hover:text-white' : 'hover:bg-slate-100 text-gray-500 hover:text-gray-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-indigo-500/20 text-pink-500">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Zainstaluj SSO Names</h2>
                  <p className="text-xs opacity-60">Dodaj bezpośredni skrót na ekran główny urządzenia</p>
                </div>
              </div>

              {/* Install trigger banner for direct install when deferredPrompt is available */}
              {deferredPrompt ? (
                <div className="mb-4 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-bold text-pink-400">Twoja przeglądarka jest gotowa!</p>
                    <p className="opacity-75">Kliknij poniższy przycisk, aby wywołać natywne okienko instalacji.</p>
                  </div>
                  <button
                    onClick={() => {
                      triggerPwaInstall();
                      setShowInstallModal(false);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black rounded-lg shadow-lg hover:brightness-110 active:scale-95 flex items-center gap-1.5 shrink-0 transition-all font-sans"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    Zainstaluj
                  </button>
                </div>
              ) : inIframe ? (
                /* iframe warning and direct open option */
                <div className="mb-4 p-4 rounded-xl bg-purple-500/15 border border-purple-500/25 text-xs text-left">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
                    <Info className="w-4 h-4" />
                    Instalacja w podglądzie jest zablokowana
                  </div>
                  <p className="opacity-75 mb-3 leading-normal">
                    Przeglądarki internetowe nie pozwalają na instalację aplikacji PWA bezpośrednio z wnętrza ramki podglądu (iframe). Otwórz aplikację w bezpiecznym, osobnym oknie przeglądarki, aby natychmiast utworzyć ikone na pulpicie!
                  </p>
                  <button
                    onClick={() => {
                      window.open(window.location.href, '_blank');
                      setShowInstallModal(false);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold rounded-lg shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Otwórz w pełnym oknie przeglądarki
                  </button>
                </div>
              ) : null}

              {/* Install Option Tabs */}
              <div className="flex border-b border-white/10 mb-4 font-sans text-xs">
                <button
                  onClick={() => setInstallTab('android')}
                  className={`flex-1 pb-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                    installTab === 'android' 
                      ? 'border-pink-500 text-pink-500' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Android (Chrome)
                </button>
                <button
                  onClick={() => setInstallTab('ios')}
                  className={`flex-1 pb-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                    installTab === 'ios' 
                      ? 'border-pink-500 text-pink-500' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  iPhone (Safari)
                </button>
                <button
                  onClick={() => setInstallTab('pc')}
                  className={`flex-1 pb-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-b-2 ${
                    installTab === 'pc' 
                      ? 'border-pink-500 text-pink-500' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Komputer (PC/Mac)
                </button>
              </div>

              {/* Tab Contents */}
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 font-sans text-xs text-left">
                {installTab === 'android' && (
                  <div className="space-y-2.5">
                    <p className="text-xs leading-relaxed opacity-80">
                      Większość telefonów z systemem Android pozwala na natychmiastowe utworzenie ikony i dodanie jej na pulpit:
                    </p>
                    <div className="space-y-2">
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">1</span>
                        <p className="text-xs leading-normal">
                          Kliknij przycisk <strong>„Pobierz App”</strong> w prawym górnym rogu strony.
                        </p>
                      </div>
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">2</span>
                        <p className="text-xs leading-normal">
                          Jeśli natywne okienko nie wyskoczyło, kliknij ikonę menu przeglądarki Chrome (trzy pionowe kropki <strong>⁝</strong> w prawym górnym rogu ekranu).
                        </p>
                      </div>
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/15 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">3</span>
                        <p className="text-xs leading-normal">
                          Z listy wybierz i naciśnij opcję <strong>„Dodaj do ekranu głównego”</strong> lub <strong>„Zainstaluj aplikację”</strong>. Skrót zostanie utworzony natychmiast!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {installTab === 'ios' && (
                  <div className="space-y-2.5">
                    <p className="text-xs leading-relaxed opacity-80">
                      Na urządzeniach marki Apple (iPhone / iPad) system iOS nie pozwala na automatyczne wywołanie natywnego okienka instalacji. Aby to zrobić ręcznie:
                    </p>
                    <div className="space-y-2">
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">1</span>
                        <p className="text-xs leading-normal">
                          Upewnij się, że przeglądasz aplikację w przeglądarce <strong>Safari</strong> (nie podglądzie w Messenger lub Instagram).
                        </p>
                      </div>
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">2</span>
                        <p className="text-xs leading-normal">
                          Naciśnij przycisk <strong>„Udostępnij”</strong> (ikona kwadratu ze strzałką skierowaną w górę) na dolnym pasku narzędzi.
                        </p>
                      </div>
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">3</span>
                        <p className="text-xs leading-normal">
                          Przesuń listę w dół i wybierz: <strong>„Dodaj do ekranu początkowego”</strong> (ikona plusa <strong>+</strong>). Nazwij aplikację i kliknij <strong>Dodaj</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {installTab === 'pc' && (
                  <div className="space-y-2.5">
                    <p className="text-xs leading-relaxed opacity-80">
                      Większość przeglądarek na systemach Windows, macOS oraz Linux pozwala zainstalować aplikację SSO Names jako natywny program komputerowy:
                    </p>
                    <div className="space-y-2">
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">1</span>
                        <p className="text-xs leading-normal">
                          W pasku adresu przeglądarki Chrome, Edge lub Opera (u samej góry ekranu, po prawej stronie obok gwiazdki) kliknij ikonę <strong>„Instaluj”</strong> (monitor ze strzałką pobierania).
                        </p>
                      </div>
                      <div className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/10 text-pink-500 text-xs font-extrabold shrink-0">2</span>
                        <p className="text-xs leading-normal">
                          Jeśli ikona nie jest widoczna, kliknij menu przeglądarki (trzy kropki <strong>⁝</strong> po prawej na górze) i wybierz opcję <strong>„Zainstaluj aplikację SSO Names...”</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* standalone notice info bar */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] opacity-60">
                <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-indigo-400" /> Pełne wsparcie dla trybu offline</span>
                {isAppInstalled ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Zainstalowano</span>
                ) : (
                  <span>Android, iOS & PC</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div 
          layout
          className="w-full max-w-5xl mx-auto"
        >
          <motion.div 
            layout
            className={`backdrop-blur-3xl border shadow-2xl rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative transition-all duration-500 ${theme.cardBg}`}
          >
            {/* Header Section */}
            <div className="text-center mb-10 relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  y: [0, -10, 0],
                }}
                transition={{ 
                  scale: { type: "spring", stiffness: 260, damping: 20 },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
                className={`w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-2xl rounded-3xl bg-gradient-to-br ${theme.button} transform -rotate-6 relative group cursor-pointer`}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-3xl transition-opacity duration-300" />
                <Sparkles className="w-12 h-12 text-white drop-shadow-md" />
              </motion.div>
              
              <h1 className={`text-4xl md:text-6xl font-bold font-display mb-4 tracking-tight ${darkMode ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
                SSO Names
              </h1>
              <p className={`text-lg font-medium max-w-lg mx-auto ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                Opisz wymarzonego wierzchowca, a my wygenerujemy dla niego idealne imię.
              </p>
            </div>

            {/* Input Section */}
            <div className="max-w-xl mx-auto space-y-8 relative z-10">
              
              {/* Mode Toggle */}
              <div className={`flex p-1 rounded-2xl ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white/40 border-white/40'} backdrop-blur-md border shadow-inner`}>
                <button
                  onClick={() => setMode('standard')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'standard' ? `${darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-gray-800 shadow-md'}` : `${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setMode('old')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'old' ? `${darkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-gray-800 shadow-md'}` : `${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'}`}`}
                >
                  Tryb "Old"
                </button>
              </div>

              <div className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${theme.button} rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500`} />
                <input
                  type="text"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Np. Galopujący po mroźnych szczytach, srebrzysty ogier..."
                  className={`relative w-full border-2 focus:border-opacity-105 rounded-2xl px-6 py-5 text-lg outline-none shadow-lg transition-all duration-300 ${
                    darkMode 
                      ? 'bg-slate-950/45 border-white/10 text-white placeholder-slate-500 focus:border-white/20 focus:bg-slate-950/70' 
                      : 'bg-white/45 border-white/50 text-gray-800 placeholder-gray-400 focus:border-pink-300 focus:bg-white/70'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98, translateY: 0 }}
                onClick={handleGenerate}
                disabled={loading || !request.trim()}
                className={`w-full bg-gradient-to-r ${theme.button} text-white font-bold text-xl py-5 rounded-2xl shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {loading ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    <span>Losuj Imiona</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="max-w-xl mx-auto overflow-hidden"
                >
                  <div className="p-4 bg-red-100/80 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence mode="wait">
              {results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-16 relative z-10"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                      Sugerowane imiona dla Twojego konia:
                    </h2>
                    <button
                      onClick={() => setResults(null)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        darkMode 
                          ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300' 
                          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Powrót do liczników
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {results.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                        className={`relative flex flex-col rounded-3xl p-6 md:p-8 border transition-all duration-500 overflow-hidden backdrop-blur-md ${
                          darkMode 
                            ? 'bg-slate-950/30 border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.25)]' 
                            : 'bg-white/45 border-white/60 shadow-[0_12px_24px_rgba(31,38,135,0.03)]'
                        }`}
                      >
                        {/* Name Card Interior */}
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                          <div className={`mb-2 text-xs uppercase tracking-widest font-bold opacity-60 ${darkMode ? 'text-slate-400' : theme.secondary}`}>
                            Propozycja #{index + 1}
                          </div>
                          
                          <div className={`text-4xl md:text-5xl font-black font-display mb-4 bg-clip-text text-transparent bg-gradient-to-r ${theme.button}`}>
                            {result.first}
                            <br />
                            {result.second}
                          </div>

                          {result.reasoning && (
                            <p className={`text-sm italic leading-relaxed mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              "{result.reasoning}"
                            </p>
                          )}
                        </div>

                        {/* Remix Actions */}
                        <div className="pt-4 border-t border-current border-opacity-10 w-full flex flex-col gap-2 scale-90">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleRemix(index, result.first, result.second, 1)}
                              disabled={!!remixingIndex}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 ${
                                darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white/60 text-gray-700 hover:bg-white'
                              }`}
                            >
                              <motion.div
                                animate={{ rotate: remixingIndex?.index === index && remixingIndex?.part === 1 ? 360 : 0 }}
                                transition={{ duration: 1, repeat: remixingIndex?.index === index && remixingIndex?.part === 1 ? Infinity : 0, ease: "linear" }}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </motion.div>
                              Początek
                            </button>
                            <button
                              onClick={() => handleRemix(index, result.first, result.second, 2)}
                              disabled={!!remixingIndex}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 ${
                                darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white/60 text-gray-700 hover:bg-white'
                              }`}
                            >
                              <motion.div
                                animate={{ rotate: remixingIndex?.index === index && remixingIndex?.part === 2 ? 360 : 0 }}
                                transition={{ duration: 1, repeat: remixingIndex?.index === index && remixingIndex?.part === 2 ? Infinity : 0, ease: "linear" }}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </motion.div>
                              Końcówka
                            </button>
                          </div>
                        </div>

                        {/* Remix Results Extension */}
                        <AnimatePresence>
                          {remixes[index] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="w-full mt-4 flex flex-col gap-3 overflow-hidden"
                            >
                              {/* Keep Second result (Change First) */}
                              {remixes[index].keepSecond && (
                                <div className={`p-3 rounded-2xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-white/50'}`}>
                                  <span className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 block opacity-70 ${theme.primary}`}>
                                    Nowy początek:
                                  </span>
                                  <div className="flex flex-col gap-1">
                                    {remixes[index].keepSecond.map((r, i) => (
                                      <button 
                                        key={i} 
                                        className={`text-sm font-bold hover:scale-105 transition-transform ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}
                                        onClick={() => {
                                          const res = [...(results || [])];
                                          const [f, s] = r.split(' ');
                                          res[index] = { ...res[index], first: f, second: s };
                                          setResults(res);
                                        }}
                                      >
                                        {r}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Keep First result (Change Second) */}
                              {remixes[index].keepFirst && (
                                <div className={`p-3 rounded-2xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-white/50'}`}>
                                  <span className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 block opacity-70 ${theme.primary}`}>
                                    Nowa końcówka:
                                  </span>
                                  <div className="flex flex-col gap-1">
                                    {remixes[index].keepFirst.map((r, i) => (
                                      <button 
                                        key={i} 
                                        className={`text-sm font-bold hover:scale-105 transition-transform ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}
                                        onClick={() => {
                                          const res = [...(results || [])];
                                          const [f, s] = r.split(' ');
                                          res[index] = { ...res[index], first: f, second: s };
                                          setResults(res);
                                        }}
                                      >
                                        {r}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="countdowns"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <EventCountdowns darkMode={darkMode} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div 
            layout
            className={`mt-8 text-center text-sm font-medium opacity-60 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}
          >
            Powered by Gemini AI • Actions Deployed • Design by Magic
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
