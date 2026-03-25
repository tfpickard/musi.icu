"use client";

import { Check, PaintBucket } from "lucide-react";
import { useTheme } from "next-themes";

const palettes = [
  { value: "tokyo-night", label: "Tokyo Night", swatch: "linear-gradient(135deg, #7aa2f7, #bb9af7)" },
  { value: "tokyo-day", label: "Tokyo Day", swatch: "linear-gradient(135deg, #2e7de9, #9854f1)" },
  { value: "synthwave", label: "Synthwave", swatch: "linear-gradient(135deg, #ff4d9d, #7c4dff)" },
  { value: "catppuccin", label: "Catppuccin", swatch: "linear-gradient(135deg, #89b4fa, #f5c2e7)" },
  { value: "gruvbox", label: "Gruvbox", swatch: "linear-gradient(135deg, #d79921, #cc241d)" },
  { value: "nord", label: "Nord", swatch: "linear-gradient(135deg, #88c0d0, #5e81ac)" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = palettes.find((palette) => palette.value === theme) ?? palettes[0];

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex list-none items-center gap-3 rounded-full border border-border bg-surface px-3 py-2 text-sm text-ink transition hover:border-accent">
          <span
            className="h-4 w-4 rounded-full border border-white/25"
            style={{ background: current.swatch }}
            aria-hidden="true"
          />
          <PaintBucket className="h-4 w-4" />
          <span>{current.label}</span>
        </summary>
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-[1.6rem] border border-border bg-surface-strong p-2 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="space-y-1">
            {palettes.map((palette) => {
              const selected = current.value === palette.value;

              return (
                <button
                  key={palette.value}
                  type="button"
                  onClick={() => setTheme(palette.value)}
                  className="flex w-full items-center justify-between rounded-[1.1rem] px-3 py-3 text-left text-sm transition hover:bg-white/6"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ background: palette.swatch }}
                      aria-hidden="true"
                    />
                    {palette.label}
                  </span>
                  {selected ? <Check className="h-4 w-4 text-accent" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}
