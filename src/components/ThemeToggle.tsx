import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-300 hover:text-white'
          : 'bg-slate-100 hover:bg-slate-200/80 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-blue-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>

      {showLabel ? (
        <span className="text-xs font-medium capitalize select-none hidden sm:inline">
          {theme}
        </span>
      ) : (
        <span className="text-[11px] font-medium hidden lg:inline select-none text-inherit">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
