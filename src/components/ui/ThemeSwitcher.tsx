"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Palette } from "@phosphor-icons/react";
import { ColorScheme } from '@/lib/theme/theme-config';

export const ThemeSwitcher: React.FC = () => {
  const { mode, colorScheme, toggleMode, setColorScheme } = useTheme();

  const colorSchemes: { value: ColorScheme; label: string; color: string }[] = [
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'green', label: 'Green', color: '#22c55e' },
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* Mode Toggle */}
      <button
        onClick={toggleMode}
        className="p-2 rounded-lg bg-surface-secondary hover:bg-surface-hover transition-colors"
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      >
        {mode === 'light' ? (
          <Moon size={20} weight="duotone" className="text-foreground-primary" />
        ) : (
          <Sun size={20} weight="duotone" className="text-foreground-primary" />
        )}
      </button>

      {/* Color Scheme Selector */}
      <div className="relative group">
        <button
          className="p-2 rounded-lg bg-surface-secondary hover:bg-surface-hover transition-colors"
          aria-label="Select color scheme"
        >
          <Palette size={20} weight="duotone" className="text-foreground-primary" />
        </button>

        {/* Dropdown */}
        <div className="absolute right-0 mt-2 w-48 bg-surface-primary border border-border-primary rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="p-2 space-y-1">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  colorScheme === scheme.value
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'hover:bg-surface-hover'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: scheme.color }}
                />
                <span className="text-sm font-medium text-foreground-primary">
                  {scheme.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
