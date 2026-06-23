import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, AlertCircle, Moon, Sun, Palette, Crown, RefreshCw, Key, LogOut, Download } from 'lucide-react';
import { generateName, remixName } from '../services/nameService';
import { EventCountdowns } from './EventCountdowns';

type Theme = {
  name: string;
  gradient: string;
  primary: string;
  secondary: string;
  accent: string;
  button: string;
  darkGradient: string;
};

const THEMES: Record<string, Theme> = {
  rose: {
    name: "Różany Ogród",
    gradient: "from-pink-200 via-rose-200 to-purple-200",
    darkGradient: "from-pink-900/40 via-rose-900/40 to-purple-900/40",
    primary: "text-rose-600",
    secondary: "text-purple-600",
    accent: "bg-rose-400",
    button: "from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700",
  },
  lavender: {
    name: "Lawendowy Sen",
    gradient: "from-indigo-200 via-purple-200 to-pink-200",
    darkGradient: "from-indigo-900/40 via-purple-900/40 to-pink-900/40",
    primary: "text-indigo-600",
    secondary: "text-pink-600",
    accent: "bg-indigo-400",
    button: "from-indigo-500 to-pink-600 hover:from-indigo-600 hover:to-pink-700",
  },
  mint: {
    name: "Miętowa Świeżość",
    gradient: "from-teal-200 via-emerald-200 to-cyan-200",
    darkGradient: "from-teal-900/40 via-emerald-900/40 to-cyan-900/40",
    primary: "text-teal-600",
    secondary: "text-cyan-600",
    accent: "bg-teal-400",
    button: "from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700",
  },
  peach: {
    name: "Brzoskwiniowy Sad",
    gradient: "from-orange-200 via-amber-200 to-yellow-200",
    darkGradient: "from-orange-900/40 via-amber-900/40 to-yellow-900/40",
    primary: "text-orange-600",
    secondary: "text-amber-600",
    accent: "bg-orange-400",
    button: "from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700",
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
  const [currentTheme, setCurrentTheme] = useState<string>('rose');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sso_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [showSettings, setShowSettings] = useState(false);

  // PWA / App Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
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
        alert("Na tym urządzeniu instalacja bezpośrednia nie jest możliwa. Jeśli chcesz dodać aplikację do ekranu głównego:\n\n• Safari (iOS/iPhone): Udostępnij -> Dodaj do ekranu początkowego\n• Chrome (Android/PC): Menu (3 kropki) -> Dodaj/Zainstaluj");
      }
    } else if (isAppInstalled) {
      alert("Aplikacja SSO Names jest już zainstalowana na Twoim urządzeniu i gotowa do użycia bezpośrednio z ekranu głównego!");
    } else {
      alert("Aby dodać aplikację do ekranu głównego telefonu lub komputera:\n\n• Na iPhone (Safari): Kliknij Udostępnij -> 'Dodaj do ekranu początkowego'\n• Na Android/PC (Chrome): Kliknij ikonę trzech kropek w prawym górnym rogu przeglądarki i wybierz 'Zainstaluj aplikację' lub 'Dodaj do ekranu głównego'");
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
        className={`absolute inset-0 bg-gradient-to-br ${
          darkMode 
            ? 'from-[#0b0424] via-[#120a32] to-[#041221]' 
            : 'from-[#fff5f5] via-[#f5f8ff] to-[#fffbfc]'
        } bg-[length:400%_400%] -z-20 transition-all duration-1000`}
      />

      {/* Liquid Glass / Shifting Aurora Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={blobVariants}
            animate="animate"
            className={`absolute rounded-full mix-blend-screen filter blur-[100px] ${darkMode ? 'opacity-55' : 'opacity-40'}`}
            style={{
              background: darkMode 
                ? `radial-gradient(circle, ${
                    i % 4 === 0 ? '#df1380' : i % 4 === 1 ? '#06b6d4' : i % 4 === 2 ? '#8b5cf6' : '#ff7e33'
                  }, transparent)` 
                : `radial-gradient(circle, ${
                    i % 3 === 0 ? '#ffe4e6' : i % 3 === 1 ? '#e0f2fe' : '#f3e8ff'
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
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {/* PWA Install Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={triggerPwaInstall}
          title="Zainstaluj jako aplikację"
          className={`px-4 py-3 rounded-full shadow-lg backdrop-blur-md transition-all border flex items-center gap-2 ${
            darkMode 
              ? 'bg-gradient-to-r from-pink-500/25 to-indigo-500/25 border-pink-500/30 text-pink-300 hover:from-pink-500/35 hover:to-indigo-500/35' 
              : 'bg-white/60 border-rose-200 text-rose-500 hover:bg-rose-50'
          }`}
        >
          <div className="relative">
            <Download className="w-4 h-4 animate-bounce" />
            {!isAppInstalled && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>
          <span className="text-xs font-bold tracking-tight">Pobierz App</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={logoutKey}
          title="Zmień API Key"
          className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-colors border ${darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white/40 border-white/40 text-gray-500 hover:bg-white/60'}`}
        >
          <Key className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-colors border ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700' : 'bg-white/40 border-white/40 text-gray-700 hover:bg-white/60'}`}
        >
          <Palette className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-colors border ${darkMode ? 'bg-slate-800/50 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white/40 border-white/40 text-slate-700 hover:bg-white/60'}`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
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



      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div 
          layout
          className="w-full max-w-5xl mx-auto"
        >
          <motion.div 
            layout
            className={`backdrop-blur-3xl border shadow-2xl rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative transition-all duration-500 ${
              darkMode 
                ? 'bg-slate-950/20 border-white/10 shadow-[0_32px_64px_rgba(15,23,42,0.4)]' 
                : 'bg-white/20 border-white/40 shadow-[0_32px_64px_rgba(31,38,135,0.06)]'
            }`}
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
                <Crown className="w-12 h-12 text-white drop-shadow-md" />
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
