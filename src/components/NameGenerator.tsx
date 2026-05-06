import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, AlertCircle, Moon, Sun, Palette, Crown, RefreshCw, Key, LogOut } from 'lucide-react';
import { generateName, remixName } from '../services/nameService';

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
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(!apiKey);

  // Remix State
  const [remixingIndex, setRemixingIndex] = useState<number | null>(null);
  const [remixes, setRemixes] = useState<Record<number, RemixData>>({});
  
  // Settings
  const [mode, setMode] = useState<'standard' | 'old'>('standard');
  const [currentTheme, setCurrentTheme] = useState<string>('rose');
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleRemix = async (index: number, first: string, second: string) => {
    setRemixingIndex(index);
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

              <div className="space-y-4">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Twój klucz API (opcjonalnie)..."
                  className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-gray-100 focus:border-rose-400'}`}
                  onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={saveApiKey}
                    className={`flex-1 py-4 rounded-2xl font-bold shadow-lg bg-gradient-to-r ${theme.button} text-white transition-transform active:scale-95`}
                  >
                    Zapisz klucz
                  </button>
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className={`flex-1 py-4 rounded-2xl font-bold border transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    Użyj domyślnego
                  </button>
                </div>
                
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-center text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity"
                >
                  Skąd wziąć klucz? (Google AI Studio)
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background with Mesh Gradient feel */}
      <motion.div 
        variants={bgVariants}
        animate="animate"
        className={`absolute inset-0 bg-gradient-to-br ${darkMode ? 'from-slate-900 via-slate-950 to-black' : theme.gradient} bg-[length:400%_400%] -z-20 transition-all duration-1000`}
      />

      {/* Liquid Glass / Aurora Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={blobVariants}
            animate="animate"
            className={`absolute rounded-full mix-blend-screen filter blur-[80px] opacity-40`}
            style={{
              background: darkMode 
                ? `radial-gradient(circle, ${i % 2 === 0 ? '#4f46e5' : '#ec4899'}, transparent)` 
                : `radial-gradient(circle, ${i % 2 === 0 ? '#ffffff' : 'rgba(255,255,255,0.8)'}, transparent)`,
              width: `${300 + Math.random() * 300}px`,
              height: `${300 + Math.random() * 300}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Header / Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
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
            className={`absolute top-20 right-4 z-40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/60 border-white/40'} w-64`}
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
            className={`backdrop-blur-2xl border shadow-2xl rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative transition-all duration-500 ${darkMode ? 'bg-slate-900/40 border-slate-700/30 shadow-slate-900/50' : 'bg-white/30 border-white/40 shadow-xl'}`}
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
                  className={`relative w-full border-2 focus:border-opacity-100 rounded-2xl px-6 py-5 text-lg outline-none shadow-lg transition-all duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500 focus:bg-slate-900' : 'bg-white/80 border-white/50 text-gray-800 placeholder-gray-400 focus:border-pink-300 focus:bg-white'}`}
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
              {results && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10"
                >
                  {results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                      className={`relative flex flex-col rounded-3xl p-6 md:p-8 border transition-all duration-500 overflow-hidden ${
                        darkMode 
                          ? 'bg-slate-800/40 border-slate-700/50 shadow-lg' 
                          : 'bg-white/40 border-white/50 shadow-sm'
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

                      {/* Remix Action */}
                      <div className="pt-4 border-t border-current border-opacity-10 w-full flex flex-col items-center">
                        <button
                          onClick={() => handleRemix(index, result.first, result.second)}
                          disabled={remixingIndex === index}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 ${
                            darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white/60 text-gray-700 hover:bg-white'
                          }`}
                        >
                          <motion.div
                            animate={{ rotate: remixingIndex === index ? 360 : 0 }}
                            transition={{ duration: 1, repeat: remixingIndex === index ? Infinity : 0, ease: "linear" }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </motion.div>
                          Remix
                        </button>
                      </div>

                      {/* Remix Results Extension */}
                      <AnimatePresence>
                        {remixes[index] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full mt-4 flex flex-col gap-4 overflow-hidden"
                          >
                            {/* Keep First */}
                            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-white/50'}`}>
                              <span className={`text-[10px] uppercase font-bold tracking-wider mb-2 block opacity-70 ${theme.primary}`}>
                                Z członem "{result.first}"
                              </span>
                              <div className="flex flex-col gap-1">
                                {remixes[index].keepFirst.map((r, i) => (
                                  <span key={i} className={`font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{r}</span>
                                ))}
                              </div>
                            </div>
                            {/* Keep Second */}
                            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-700/50' : 'bg-white/50'}`}>
                              <span className={`text-[10px] uppercase font-bold tracking-wider mb-2 block opacity-70 ${theme.primary}`}>
                                Z członem "{result.second}"
                              </span>
                              <div className="flex flex-col gap-1">
                                {remixes[index].keepSecond.map((r, i) => (
                                  <span key={i} className={`font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{r}</span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
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
