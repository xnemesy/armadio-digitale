'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="surface border-b border-custom sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">👔</span>
            <span className="text-xl font-bold text-primary">Armadio Digitale</span>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-secondary hover:text-primary transition-colors">
                Guardaroba
              </Link>
              <Link href="/add" className="text-secondary hover:text-primary transition-colors">
                Aggiungi
              </Link>
              <Link href="/outfits" className="text-secondary hover:text-primary transition-colors">
                Outfit AI
              </Link>
              <Link href="/stats" className="text-secondary hover:text-primary transition-colors">
                Statistiche
              </Link>
              <Link href="/profile" className="text-secondary hover:text-primary transition-colors">
                Profilo
              </Link>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg surface-light hover:bg-accent-light/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={20} className="text-secondary" />
              ) : (
                <Moon size={20} className="text-secondary" />
              )}
            </button>

            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-3">
                <Link
                  href="/profile"
                  className="p-2 rounded-lg surface-light hover:bg-accent-light/10 transition-colors"
                >
                  <User size={20} className="text-secondary" />
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg surface-light hover:bg-red-500/10 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={20} className="text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
