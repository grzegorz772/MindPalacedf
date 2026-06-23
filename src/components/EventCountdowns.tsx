import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Sun, Ghost, Snowflake, Calendar, Clock, Sparkles, TreeDeciduous, PartyPopper } from 'lucide-react';

interface FestivalRange {
  id: string;
  name: string;
  englishName: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  getRange: (year: number) => { start: Date; end: Date };
}

// Dynamic helper to find the N-th Wednesday of a given month (0-indexed month)
function getWednesdayOfMonth(year: number, month: number, nth: number): Date {
  const date = new Date(year, month, 1, 12, 0, 0); // Guarded for timezone shift
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === 3) { // 3 = Wednesday
      count++;
      if (count === nth) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      }
    }
    date.setDate(date.getDate() + 1);
  }
  return new Date(year, month, 28, 12, 0, 0); // fallback approximate
}

const SSO_FESTIVALS: FestivalRange[] = [
  {
    id: 'equestrian',
    name: 'Święto Jeździeckie',
    englishName: 'Equestrian Festival',
    icon: Award,
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    getRange: (year: number) => {
      const start = getWednesdayOfMonth(year, 3, 1); // April (month index 3) 1st Wednesday
      const end = new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks
      return { start, end };
    }
  },
  {
    id: 'summer',
    name: 'Festiwal Letnich Dni (Summer Daze)',
    englishName: 'Summer Daze Festival',
    icon: Sun,
    color: 'amber',
    gradient: 'from-amber-500/20 to-orange-500/10',
    getRange: (year: number) => {
      const start = getWednesdayOfMonth(year, 5, 1); // June (month index 5) 1st Wednesday
      const end = new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks
      return { start, end };
    }
  },
  {
    id: 'halloween',
    name: 'Festiwal Halloween',
    englishName: 'Halloween Festival',
    icon: Ghost,
    color: 'purple',
    gradient: 'from-purple-500/20 to-indigo-500/10',
    getRange: (year: number) => {
      const start = getWednesdayOfMonth(year, 9, 2); // October (month index 9) 2nd Wednesday
      const end = getWednesdayOfMonth(year, 10, 1); // November (month index 10) 1st Wednesday
      return { start, end };
    }
  },
  {
    id: 'winter',
    name: 'Święto Zimy',
    englishName: 'Winter Festival',
    icon: Snowflake,
    color: 'sky',
    gradient: 'from-sky-500/20 to-blue-500/10',
    getRange: (year: number) => {
      const start = getWednesdayOfMonth(year, 11, 1); // December (month index 11) 1st Wednesday
      const end = new Date(start.getTime() + 35 * 24 * 60 * 60 * 1000); // 5 weeks
      return { start, end };
    }
  }
];

interface SecondaryFestival {
  id: string;
  englishName: string;
  icon: React.ComponentType<any>;
  getRange: (year: number) => { start: Date; end: Date };
}

const SECONDARY_FESTIVALS: SecondaryFestival[] = [
  {
    id: 'camp_western',
    englishName: 'Camp Western',
    icon: TreeDeciduous,
    getRange: (year: number) => {
      const start = getWednesdayOfMonth(year, 7, 1); // August (month index 7) 1st Wednesday
      const end = new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks
      return { start, end };
    }
  },
  {
    id: 'new_year',
    englishName: "New Year's Eve",
    icon: PartyPopper,
    getRange: (year: number) => {
      const start = new Date(year, 11, 28, 0, 0, 0); // Dec 28
      const end = new Date(year, 11, 31, 23, 59, 59); // Dec 31
      return { start, end };
    }
  }
];

interface FestivalCountdown {
  id: string;
  name: string;
  englishName: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  isActive: boolean;
  targetDate: Date;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  startDateFormatted: string;
  daysToStart: number;
  progressPercent: number;
  festivalProgressText?: string;
}

interface SecondaryCountdown {
  id: string;
  englishName: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function EventCountdowns({ darkMode }: { darkMode: boolean }) {
  const [countdowns, setCountdowns] = useState<FestivalCountdown[]>([]);
  const [secondaryCountdowns, setSecondaryCountdowns] = useState<SecondaryCountdown[]>([]);

  useEffect(() => {
    const calculateCountdowns = () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Primary countdowns
      const calculatedPrim = SSO_FESTIVALS.map(fest => {
        let { start, end } = fest.getRange(currentYear);
        
        // If event ended this year, calculate for next year
        if (now > end) {
          const nextYearRange = fest.getRange(currentYear + 1);
          start = nextYearRange.start;
          end = nextYearRange.end;
        }

        const isActive = now >= start && now <= end;
        const targetDate = isActive ? end : start;
        const diffMs = targetDate.getTime() - now.getTime();

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
        const startDateFormatted = start.toLocaleDateString('pl-PL', formatOptions);

        let progressPercent = 0;
        let festivalProgressText = "";
        const daysToStart = isActive ? 0 : Math.max(0, days);

        if (isActive) {
          const totalDuration = end.getTime() - start.getTime();
          const elapsed = now.getTime() - start.getTime();
          progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
          
          const totalDays = Math.round(totalDuration / (1000 * 60 * 60 * 24));
          const elDays = Math.floor(elapsed / (1000 * 60 * 60 * 24)) + 1;
          festivalProgressText = `Dzień ${elDays} z ${totalDays}`;
        } else {
          progressPercent = (daysToStart / 365) * 100;
        }

        return {
          id: fest.id,
          name: fest.name,
          englishName: fest.englishName,
          icon: fest.icon,
          color: fest.color,
          gradient: fest.gradient,
          isActive,
          targetDate,
          days: Math.max(0, days),
          hours: Math.max(0, hours),
          minutes: Math.max(0, minutes),
          seconds: Math.max(0, seconds),
          startDateFormatted,
          daysToStart,
          progressPercent,
          festivalProgressText
        };
      });

      // Secondary countdowns
      const calculatedSec = SECONDARY_FESTIVALS.map(fest => {
        let { start, end } = fest.getRange(currentYear);
        
        if (now > end) {
          const nextYearRange = fest.getRange(currentYear + 1);
          start = nextYearRange.start;
          end = nextYearRange.end;
        }

        const isActive = now >= start && now <= end;
        const targetDate = isActive ? end : start;
        const diffMs = targetDate.getTime() - now.getTime();

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        return {
          id: fest.id,
          englishName: fest.englishName,
          icon: fest.icon,
          isActive,
          days: Math.max(0, days),
          hours: Math.max(0, hours),
          minutes: Math.max(0, minutes),
          seconds: Math.max(0, seconds),
        };
      });

      // Sort primary events
      calculatedPrim.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.daysToStart - b.daysToStart;
      });

      setCountdowns(calculatedPrim);
      setSecondaryCountdowns(calculatedSec);
    };

    calculateCountdowns();
    const interval = setInterval(calculateCountdowns, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set colors based on dynamic tailwind class strings
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald': return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/40 bg-emerald-400 border-emerald-300' };
      case 'amber': return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/40 bg-amber-400 border-amber-300' };
      case 'purple': return { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/40 bg-purple-400 border-purple-300' };
      case 'sky': return { bg: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500/20', glow: 'shadow-sky-500/40 bg-sky-400 border-sky-300' };
      default: return { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/40 bg-indigo-400 border-indigo-300' };
    }
  };

  return (
    <div className="w-full mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {countdowns.map((fest) => {
          const IconComponent = fest.icon;
          const colors = getColorClasses(fest.color);

          return (
            <motion.div
              key={fest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`p-5 rounded-3xl border transition-all relative overflow-hidden backdrop-blur-lg ${
                fest.isActive 
                  ? darkMode 
                    ? 'bg-slate-950/25 border-pink-500/30 shadow-[0_16px_32px_rgba(236,72,153,0.15)] ring-1 ring-pink-500/20' 
                    : 'bg-white/45 border-pink-400 shadow-[0_16px_32px_rgba(236,72,153,0.08)] ring-1 ring-pink-400/20'
                  : darkMode 
                    ? 'bg-slate-950/25 border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.1)]' 
                    : 'bg-white/20 border-white/45 shadow-[0_12px_24px_rgba(31,38,135,0.02)]'
              }`}
            >
              {/* Active Breathing Highlight Gradient */}
              {fest.isActive && (
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 to-transparent pointer-events-none" />
              )}

              {/* Top Row: Icon and Badges */}
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${fest.isActive ? 'bg-pink-500/10' : darkMode ? 'bg-slate-800/80' : 'bg-white/80'} shadow-sm`}>
                  <IconComponent className={`w-5 h-5 ${fest.isActive ? 'text-pink-400 font-bold' : colors.text}`} />
                </div>
                
                {fest.isActive ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full text-[10px] font-extrabold text-pink-400 uppercase animate-pulse">
                    <Sparkles className="w-3 h-3" /> Trwa obecnie!
                  </span>
                ) : (
                  <span className={`px-2.5 py-1 ${darkMode ? 'bg-slate-800/50' : 'bg-gray-100/80'} rounded-full text-[10px] font-bold opacity-80`}>
                    Od {fest.startDateFormatted}
                  </span>
                )}
              </div>

              {/* Event Name */}
              <div className="mb-4">
                <h3 className={`font-bold font-display text-base leading-snug ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                  {fest.englishName}
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {fest.name}
                </p>
              </div>

              {/* Timeline Axis (Oś Czasu) */}
              <div className="mt-4 mb-4 select-none">
                <div className="flex justify-between items-center text-[9px] font-semibold opacity-70 mb-2 px-0.5">
                  <span className={darkMode ? 'text-slate-400' : 'text-gray-500'}>
                    {fest.isActive ? 'Rozpoczęcie' : '0 dni (Dziś)'}
                  </span>
                  {fest.isActive ? (
                    <span className="font-extrabold text-pink-500 bg-pink-500/15 px-2 py-0.5 rounded-full text-[10px] shadow-[0_0_8px_rgba(236,72,153,0.2)] animate-pulse">
                      {fest.festivalProgressText}
                    </span>
                  ) : (
                    <span className={`font-extrabold ${colors.text} bg-white/5 dark:bg-black/20 px-1.5 py-0.5 rounded-md`}>
                      Za {fest.daysToStart} dni
                    </span>
                  )}
                  <span className={darkMode ? 'text-slate-400' : 'text-gray-500'}>
                    {fest.isActive ? 'Koniec' : '365 dni'}
                  </span>
                </div>

                {fest.isActive ? (
                  <div className="relative h-2.5 w-full rounded-full bg-pink-500/10 dark:bg-pink-950/20 overflow-visible border border-pink-500/10 shadow-inner">
                    {/* Glowing highlight layer below */}
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 opacity-60 blur-[3px]"
                      style={{ width: `${fest.progressPercent}%` }}
                    />
                    {/* Colored Fill Track */}
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 overflow-hidden"
                      style={{ width: `${fest.progressPercent}%` }}
                    >
                      {/* Infinite sweep white shimmer wave */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2"
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      />
                    </div>

                    {/* Highly glowing dynamic active slider dot */}
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-4.5 h-4.5 rounded-full border-2 border-white bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)] z-10 cursor-pointer"
                      style={{ left: `${fest.progressPercent}%` }}
                      animate={{
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          '0 0 6px rgba(236,72,153,0.5)',
                          '0 0 14px rgba(236,72,153,0.85)',
                          '0 0 6px rgba(236,72,153,0.5)'
                        ]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.8,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative h-1.5 w-full rounded-full bg-slate-200/40 dark:bg-slate-800/80 overflow-visible">
                    {/* Track line fill showing path progress up to the indicator */}
                    <div 
                      className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-${fest.color}-500`}
                      style={{ width: `${fest.progressPercent}%` }}
                    />

                    {/* Pulsing visual ball (Kulka) */}
                    <motion.div
                      className={`absolute top-1/2 -translate-y-1/2 -ml-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${colors.bg} ${colors.glow}`}
                      style={{ left: `${fest.progressPercent}%` }}
                      animate={{
                        scale: [1, 1.08, 1],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Countdown Numbers Grid */}
              <div className="mt-4 pt-1">
                <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-60 mb-2 font-mono">
                  {fest.isActive ? 'Do zakończenia:' : 'Czas do rozpoczęcia:'}
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className={`rounded-xl py-1 px-0.5 border ${darkMode ? 'bg-slate-950/25 border-white/5' : 'bg-white/40 border-white/50'}`}>
                    <span className="block font-mono font-bold text-base leading-none text-pink-500">
                      {fest.days}
                    </span>
                    <span className="block text-[8px] uppercase tracking-tighter opacity-60">dni</span>
                  </div>
                  <div className={`rounded-xl py-1 px-0.5 border ${darkMode ? 'bg-slate-950/25 border-white/5' : 'bg-white/40 border-white/50'}`}>
                    <span className="block font-mono font-bold text-base leading-none">
                      {fest.hours.toString().padStart(2, '0')}
                    </span>
                    <span className="block text-[8px] uppercase tracking-tighter opacity-60">godz</span>
                  </div>
                  <div className={`rounded-xl py-1 px-0.5 border ${darkMode ? 'bg-slate-950/25 border-white/5' : 'bg-white/40 border-white/50'}`}>
                    <span className="block font-mono font-bold text-base leading-none">
                      {fest.minutes.toString().padStart(2, '0')}
                    </span>
                    <span className="block text-[8px] uppercase tracking-tighter opacity-60">min</span>
                  </div>
                  <div className={`rounded-xl py-1 px-0.5 border ${darkMode ? 'bg-slate-950/25 border-white/5' : 'bg-white/40 border-white/50'}`}>
                    <span className="block font-mono font-bold text-base leading-none animate-pulse">
                      {fest.seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="block text-[8px] uppercase tracking-tighter opacity-60">sek</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

        {/* Secondary Events Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'camp_western', englishName: 'Camp Western', icon: TreeDeciduous, desc: 'August • Firgrove wilderness & gold panning' },
            { id: 'new_year', englishName: "New Year's Eve", icon: PartyPopper, desc: 'Late December • Winter Village & fireworks' },
          ].map((event, i) => {
            const IconComponent = event.icon;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                whileHover={{ y: -1 }}
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                  darkMode
                    ? 'bg-slate-950/25 border-white/5 shadow-md hover:border-white/10'
                    : 'bg-white/20 border-white/45 shadow-[0_4px_12px_rgba(31,38,135,0.01)] hover:border-white/65'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-white/5 text-indigo-400' : 'bg-white/70 text-indigo-500 shadow-sm'}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold tracking-tight ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                    {event.englishName}
                  </h4>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                    {event.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
    </div>
  );
}
