'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Bright is the default. This toggle opts into the dark "mood" by adding `dark`
// to <html> and persisting it; the no-flash script in the root layout restores
// it on the next load. Dark tokens are scoped to `html.dark .marketing-canvas`,
// so this never touches the dashboard app.
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('avori-theme', next ? 'dark' : 'light');
    } catch {
      /* private mode: theme just won't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:text-fg ${className}`}
    >
      {/* Render nothing theme-specific until mounted to avoid a hydration mismatch. */}
      {mounted && (dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
    </button>
  );
}
