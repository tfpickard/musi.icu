"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({
  children,
  ...props
}: {
  children: ReactNode;
  attribute: "class";
  defaultTheme: string;
  enableSystem: boolean;
}) {
  return (
    <NextThemesProvider
      themes={["tokyo-night", "tokyo-day", "synthwave", "catppuccin", "gruvbox", "nord"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
