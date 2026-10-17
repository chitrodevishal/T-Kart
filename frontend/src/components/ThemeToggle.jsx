import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../storefront/useTheme';

export function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-slate-700 transition hover:bg-slate-50"
    >
      <Icon size={17} aria-hidden="true" />
      {!compact && <span className="hidden text-xs font-semibold sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>}
    </button>
  );
}
